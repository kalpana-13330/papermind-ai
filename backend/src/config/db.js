const mongoose = require('mongoose');
const dns = require('dns');
const axios = require('axios');

// Set public DNS servers to help resolve SRV records on networks with strict local DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignored if OS restricts setServers
}

/**
 * Resolve SRV records over HTTPS via Google/Cloudflare DoH
 * Bypasses local ISP / Windows DNS filtering that drops SRV queries (type 33)
 */
async function resolveSrvOverHttps(srvHost) {
  const queryName = `_mongodb._tcp.${srvHost}`;
  
  // Try Google DNS over HTTPS
  try {
    const res = await axios.get(`https://dns.google/resolve?name=${encodeURIComponent(queryName)}&type=SRV`, { timeout: 4000 });
    if (res.data && Array.isArray(res.data.Answer) && res.data.Answer.length > 0) {
      return res.data.Answer.map(ans => {
        const parts = ans.data.trim().split(/\s+/);
        const port = parts[2] || '27017';
        const target = (parts[3] || '').replace(/\.$/, '');
        return `${target}:${port}`;
      }).filter(s => s && !s.startsWith(':'));
    }
  } catch (err) {}

  // Try Cloudflare DNS over HTTPS
  try {
    const res = await axios.get(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(queryName)}&type=SRV`, {
      headers: { Accept: 'application/dns-json' },
      timeout: 4000,
    });
    if (res.data && Array.isArray(res.data.Answer) && res.data.Answer.length > 0) {
      return res.data.Answer.map(ans => {
        const parts = ans.data.trim().split(/\s+/);
        const port = parts[2] || '27017';
        const target = (parts[3] || '').replace(/\.$/, '');
        return `${target}:${port}`;
      }).filter(s => s && !s.startsWith(':'));
    }
  } catch (err) {}

  return null;
}

/**
 * Convert a mongodb+srv:// URI to direct replica set mongodb:// URI
 * when local DNS fails on SRV lookups (querySrv ECONNREFUSED)
 */
async function buildDirectUriFromSrv(srvUri) {
  const match = srvUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/\?]+)(?:\/([^?]*))?(?:\?(.*))?$/);
  if (!match) return null;

  const [, user, pass, host, dbname = '', rawParams = ''] = match;
  
  // 1. Attempt to resolve live shard hostnames via DNS-over-HTTPS
  let servers = await resolveSrvOverHttps(host);

  // 2. If DoH didn't return, derive deterministic MongoDB Atlas shard naming
  if (!servers || servers.length === 0) {
    const hostParts = host.split('.');
    const clusterName = hostParts[0]; // e.g. cluster0
    const clusterId = hostParts[1];   // e.g. 7vg4p6s
    if (clusterName && clusterId) {
      servers = [
        `${clusterName}-shard-00-00.${clusterId}.mongodb.net:27017`,
        `${clusterName}-shard-00-01.${clusterId}.mongodb.net:27017`,
        `${clusterName}-shard-00-02.${clusterId}.mongodb.net:27017`,
      ];
    }
  }

  if (!servers || servers.length === 0) return null;

  return `mongodb://${user}:${pass}@${servers.join(',')}/${dbname}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
}

/**
 * Connect to MongoDB with resilient DNS fallback
 */
const connectDB = async () => {
  let uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_paper_summarizer').trim();
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.replace(/^MONGODB_URI=\s*/, '');
  }

  // 1. Try standard connection first
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (primaryErr) {
    console.warn(`[Database] Primary connection failed (${primaryErr.message}). Attempting DNS bypass fallback...`);

    // 2. If SRV resolution failed, attempt direct replica set connection
    if (uri.startsWith('mongodb+srv://') && (primaryErr.message.includes('querySrv') || primaryErr.message.includes('ENOTFOUND') || primaryErr.message.includes('ECONNREFUSED'))) {
      try {
        const directUri = await buildDirectUriFromSrv(uri);
        if (directUri) {
          console.log('[Database] Connecting via direct Atlas replica set nodes (SRV bypassed)...');
          const conn = await mongoose.connect(directUri, {
            serverSelectionTimeoutMS: 10000,
          });
          console.log(`[Database] MongoDB Connected via direct nodes: ${conn.connection.host}/${conn.connection.name}`);
          return conn;
        }
      } catch (fallbackErr) {
        console.error(`[Database Error] Direct replica set fallback failed: ${fallbackErr.message}`);
      }
    }

    // Log error but allow process to remain alive for graceful retries
    console.error(`[Database] FATAL: Failed to connect to MongoDB: ${primaryErr.message}`);
    throw primaryErr;
  }
};

/**
 * Disconnect from MongoDB gracefully
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  } catch (error) {
    console.error(`[Database Error] Error closing MongoDB connection: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
