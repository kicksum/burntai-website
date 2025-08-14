// Add this to your admin-activity.html in the <script> section

// IP Lookup Modal HTML - Add this right after the loading overlay div in your HTML
const ipModalHTML = `
<div id="ipLookupModal" style="
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 10000;
    align-items: center;
    justify-content: center;
">
    <div style="
        background: linear-gradient(145deg, #0f0f0f, #1a1a1a);
        border: 2px solid var(--neon-cyan);
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    ">
        <span onclick="closeIPModal()" style="
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 2rem;
            color: var(--neon-cyan);
            cursor: pointer;
            transition: all 0.3s;
        " onmouseover="this.style.transform='rotate(90deg)'" onmouseout="this.style.transform='rotate(0)'">×</span>
        
        <h2 style="
            font-family: 'Orbitron', sans-serif;
            color: var(--neon-orange);
            margin-bottom: 20px;
            text-transform: uppercase;
        ">IP Intelligence Report</h2>
        
        <div id="ipLookupContent">
            <div style="text-align: center; padding: 40px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    border: 3px solid var(--neon-cyan);
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                "></div>
                <p style="margin-top: 20px; color: var(--neon-cyan);">Scanning IP location...</p>
            </div>
        </div>
    </div>
</div>
`;

// Add the modal to the page
document.body.insertAdjacentHTML('beforeend', ipModalHTML);

// IP Lookup Functions
async function lookupIP(ip) {
    // Show modal immediately
    document.getElementById('ipLookupModal').style.display = 'flex';
    document.getElementById('ipLookupContent').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="
                width: 60px;
                height: 60px;
                border: 3px solid var(--neon-cyan);
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            "></div>
            <p style="margin-top: 20px; color: var(--neon-cyan);">Analyzing IP: ${ip}</p>
        </div>
    `;
    
    try {
        // Call your backend API for IP lookup
        const response = await fetch(`/api/admin-activity-api-working.php?action=iplookup&ip=${ip}`);
        const data = await response.json();
        
        if (data.success) {
            displayIPInfo(data.info);
        } else {
            // Fallback to free IP API services
            const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
            const geoData = await geoResponse.json();
            displayIPInfo(geoData);
        }
    } catch (error) {
        // Fallback to basic WHOIS iframe
        displayBasicWhois(ip);
    }
}

function displayIPInfo(info) {
    const threatLevel = assessThreatLevel(info);
    const threatColor = threatLevel === 'HIGH' ? '#ff4444' : 
                       threatLevel === 'MEDIUM' ? '#ff9800' : '#66bb6a';
    
    const content = `
        <div style="
            display: grid;
            gap: 20px;
        ">
            <!-- IP Header -->
            <div style="
                background: rgba(77, 208, 225, 0.1);
                border: 1px solid rgba(77, 208, 225, 0.3);
                border-radius: 10px;
                padding: 20px;
            ">
                <h3 style="color: var(--neon-cyan); margin-bottom: 15px; font-size: 1.2rem;">
                    🌍 ${info.ip || info.query || 'Unknown IP'}
                </h3>
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    font-size: 0.9rem;
                ">
                    <div><span style="color: rgba(255,255,255,0.5);">Country:</span> <span style="color: white;">${info.country_name || info.country || 'Unknown'} ${getFlagEmoji(info.country_code || info.countryCode || '')}</span></div>
                    <div><span style="color: rgba(255,255,255,0.5);">City:</span> <span style="color: white;">${info.city || 'Unknown'}</span></div>
                    <div><span style="color: rgba(255,255,255,0.5);">Region:</span> <span style="color: white;">${info.region || info.regionName || 'Unknown'}</span></div>
                    <div><span style="color: rgba(255,255,255,0.5);">ISP:</span> <span style="color: white;">${info.org || info.isp || 'Unknown'}</span></div>
                </div>
            </div>
            
            <!-- Threat Assessment -->
            <div style="
                background: rgba(255, 68, 68, 0.1);
                border: 1px solid ${threatColor};
                border-radius: 10px;
                padding: 20px;
            ">
                <h3 style="color: ${threatColor}; margin-bottom: 15px;">
                    ⚠️ Threat Assessment
                </h3>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                ">
                    <span>Threat Level:</span>
                    <span style="
                        font-family: 'Orbitron', sans-serif;
                        font-size: 1.5rem;
                        color: ${threatColor};
                        text-shadow: 0 0 10px ${threatColor};
                    ">${threatLevel}</span>
                </div>
                <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    ${getThreatDetails(info)}
                </div>
            </div>
            
            <!-- Technical Details -->
            <div style="
                background: rgba(102, 187, 106, 0.1);
                border: 1px solid rgba(102, 187, 106, 0.3);
                border-radius: 10px;
                padding: 20px;
            ">
                <h3 style="color: var(--neon-green); margin-bottom: 15px;">
                    📊 Technical Details
                </h3>
                <div style="font-size: 0.9rem;">
                    <div style="margin-bottom: 10px;">
                        <span style="color: rgba(255,255,255,0.5);">Timezone:</span> 
                        <span style="color: white;">${info.timezone || info.time_zone || 'Unknown'}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="color: rgba(255,255,255,0.5);">Coordinates:</span> 
                        <span style="color: white;">${info.latitude || info.lat || '?'}, ${info.longitude || info.lon || '?'}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="color: rgba(255,255,255,0.5);">AS Number:</span> 
                        <span style="color: white;">${info.asn || 'Unknown'}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="color: rgba(255,255,255,0.5);">Type:</span> 
                        <span style="color: white;">${detectIPType(info)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            ">
                <button onclick="blockIP('${info.ip || info.query}')" style="
                    padding: 10px 20px;
                    background: rgba(255, 68, 68, 0.2);
                    border: 1px solid var(--neon-red);
                    border-radius: 25px;
                    color: var(--neon-red);
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🚫 Block IP
                </button>
                <a href="https://www.abuseipdb.com/check/${info.ip || info.query}" target="_blank" style="
                    padding: 10px 20px;
                    background: rgba(77, 208, 225, 0.2);
                    border: 1px solid var(--neon-cyan);
                    border-radius: 25px;
                    color: var(--neon-cyan);
                    text-decoration: none;
                    display: inline-block;
                    transition: all 0.3s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔍 Check Abuse DB
                </a>
                <a href="https://whois.domaintools.com/${info.ip || info.query}" target="_blank" style="
                    padding: 10px 20px;
                    background: rgba(102, 187, 106, 0.2);
                    border: 1px solid var(--neon-green);
                    border-radius: 25px;
                    color: var(--neon-green);
                    text-decoration: none;
                    display: inline-block;
                    transition: all 0.3s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    📄 Full WHOIS
                </a>
            </div>
        </div>
    `;
    
    document.getElementById('ipLookupContent').innerHTML = content;
}

function displayBasicWhois(ip) {
    const content = `
        <div style="text-align: center;">
            <p style="color: var(--neon-cyan); margin-bottom: 20px;">Direct API unavailable. Opening external WHOIS...</p>
            <iframe src="https://whois.domaintools.com/${ip}" style="
                width: 100%;
                height: 400px;
                border: 1px solid var(--neon-cyan);
                border-radius: 10px;
            "></iframe>
            <div style="margin-top: 20px;">
                <a href="https://www.abuseipdb.com/check/${ip}" target="_blank" style="
                    color: var(--neon-orange);
                    text-decoration: underline;
                ">Check IP Reputation →</a>
            </div>
        </div>
    `;
    
    document.getElementById('ipLookupContent').innerHTML = content;
}

function assessThreatLevel(info) {
    const country = (info.country_name || info.country || '').toLowerCase();
    const org = (info.org || info.isp || '').toLowerCase();
    
    // High threat countries (known for attacks)
    const highThreatCountries = ['china', 'russia', 'north korea', 'iran', 'vietnam'];
    const mediumThreatCountries = ['romania', 'ukraine', 'brazil', 'india', 'turkey'];
    
    // Suspicious ISPs/Orgs
    const suspiciousOrgs = ['vpn', 'proxy', 'hosting', 'cloud', 'data center', 'tor'];
    
    if (highThreatCountries.some(c => country.includes(c))) {
        return 'HIGH';
    }
    
    if (mediumThreatCountries.some(c => country.includes(c))) {
        return 'MEDIUM';
    }
    
    if (suspiciousOrgs.some(o => org.includes(o))) {
        return 'MEDIUM';
    }
    
    return 'LOW';
}

function getThreatDetails(info) {
    const details = [];
    const country = (info.country_name || info.country || '').toLowerCase();
    const org = (info.org || info.isp || '').toLowerCase();
    
    if (country.includes('china')) {
        details.push('• Known origin for automated attacks');
        details.push('• Frequently hosts bot networks');
    }
    
    if (org.includes('vpn') || org.includes('proxy')) {
        details.push('• Using VPN/Proxy service');
        details.push('• Identity may be masked');
    }
    
    if (org.includes('hosting') || org.includes('cloud')) {
        details.push('• Datacenter IP (not residential)');
        details.push('• Possible bot or automated tool');
    }
    
    if (details.length === 0) {
        details.push('• No immediate threats detected');
        details.push('• Appears to be legitimate traffic');
    }
    
    return details.join('<br>');
}

function detectIPType(info) {
    const org = (info.org || info.isp || '').toLowerCase();
    
    if (org.includes('vpn')) return 'VPN Service';
    if (org.includes('proxy')) return 'Proxy Server';
    if (org.includes('tor')) return 'Tor Exit Node';
    if (org.includes('hosting') || org.includes('cloud')) return 'Datacenter/Cloud';
    if (org.includes('mobile') || org.includes('cellular')) return 'Mobile Network';
    
    return 'Residential/Business ISP';
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return '';
    const code = countryCode.toUpperCase();
    const flags = {
        'US': '🇺🇸', 'CN': '🇨🇳', 'RU': '🇷🇺', 'GB': '🇬🇧', 'DE': '🇩🇪',
        'FR': '🇫🇷', 'JP': '🇯🇵', 'KR': '🇰🇷', 'IN': '🇮🇳', 'BR': '🇧🇷',
        'CA': '🇨🇦', 'AU': '🇦🇺', 'NL': '🇳🇱', 'SE': '🇸🇪', 'SG': '🇸🇬'
    };
    return flags[code] || '🏴';
}

function closeIPModal() {
    document.getElementById('ipLookupModal').style.display = 'none';
}

function blockIP(ip) {
    if (confirm(`Block IP ${ip}?\n\nThis will add it to your firewall rules.`)) {
        // Call your backend to add firewall rule
        fetch(`/api/admin-activity-api-working.php?action=blockip&ip=${ip}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`IP ${ip} has been blocked`);
                    closeIPModal();
                    loadDashboardData(); // Refresh the dashboard
                }
            });
    }
}

// Update the activity feed HTML to make IPs clickable
function updateActivityFeed(activities) {
    activityData = activities;
    const feed = document.getElementById('activityFeed');
    const filtered = currentFilter === 'all' ? activities : 
                    activities.filter(a => a.type === currentFilter);
    
    feed.innerHTML = filtered.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(activity.type)}</div>
            <div class="activity-details">
                <div class="activity-action">${activity.action}</div>
                <div class="activity-meta">
                    <span style="cursor: pointer; text-decoration: underline;" onclick="lookupIP('${activity.ip}')">📍 ${activity.ip}</span>
                    <span>📄 ${activity.page}</span>
                    ${activity.userAgent ? `<span>🖥️ ${activity.userAgent}</span>` : ''}
                </div>
            </div>
            <div class="activity-time">${formatTime(activity.timestamp)}</div>
        </div>
    `).join('');
}