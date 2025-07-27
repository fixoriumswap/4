// Demo script to test VPN detection
// Run this with: node demo/vpn-test.js

const fetch = require('node-fetch');

async function testLocationDetection() {
  try {
    // Test with a known VPN IP (example - this won't work in real production)
    const testIPs = [
      '8.8.8.8', // Google DNS (likely detected as datacenter)
      '1.1.1.1', // Cloudflare DNS (likely detected as datacenter)
      '127.0.0.1', // localhost
    ];

    console.log('🔍 Testing VPN/Proxy Detection...\n');

    for (const ip of testIPs) {
      console.log(`Testing IP: ${ip}`);
      
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,isp,org,proxy`);
        const data = await response.json();
        
        console.log('Response:', JSON.stringify(data, null, 2));
        
        // Simple VPN detection logic
        const isp = (data.isp || '').toLowerCase();
        const org = (data.org || '').toLowerCase();
        
        const vpnIndicators = ['google', 'cloudflare', 'amazon', 'microsoft', 'hosting', 'server', 'datacenter'];
        const isVPN = vpnIndicators.some(indicator => 
          isp.includes(indicator) || org.includes(indicator)
        ) || data.proxy === true;
        
        console.log(`VPN Detected: ${isVPN ? '✅ YES' : '❌ NO'}`);
        console.log('---\n');
        
      } catch (error) {
        console.log(`Error testing ${ip}:`, error.message);
      }
    }
    
    console.log('💡 In production, this would be called from your location API endpoint');
    console.log('📱 Users with VPNs would see a warning to disable their VPN');
    
  } catch (error) {
    console.error('Demo error:', error);
  }
}

if (require.main === module) {
  testLocationDetection();
}

module.exports = { testLocationDetection };
