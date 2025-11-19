/**
 * Country Detection Service
 * Detects user's country from IP address using free APIs
 */

import axios from 'axios';

interface CountryResult {
  country_code: string;
  country_name: string;
  detected_from: 'ip' | 'header' | 'default';
}

class CountryDetectionService {
  /**
   * Detect country from IP address
   * Uses multiple free APIs with fallback
   */
  async detectCountry(ip: string, headers?: any): Promise<CountryResult> {
    try {
      // Skip localhost/private IPs
      if (this.isPrivateIP(ip)) {
        return this.getDefaultCountry();
      }

      // Try CF-IPCountry header first (Cloudflare)
      if (headers && headers['cf-ipcountry']) {
        const countryCode = headers['cf-ipcountry'].toUpperCase();
        if (countryCode !== 'XX' && countryCode.length === 2) {
          return {
            country_code: countryCode,
            country_name: this.getCountryName(countryCode),
            detected_from: 'header',
          };
        }
      }

      // Try ip-api.com (free, no key required, 45 req/min)
      try {
        const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`, {
          timeout: 3000,
        });
        
        if (response.data.status === 'success' && response.data.countryCode) {
          return {
            country_code: response.data.countryCode,
            country_name: response.data.country,
            detected_from: 'ip',
          };
        }
      } catch (error) {
        console.log('[COUNTRY] ip-api.com failed, trying fallback');
      }

      // Fallback to ipapi.co (free, 1000 req/day)
      try {
        const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
          timeout: 3000,
        });
        
        if (response.data.country_code) {
          return {
            country_code: response.data.country_code,
            country_name: response.data.country_name,
            detected_from: 'ip',
          };
        }
      } catch (error) {
        console.log('[COUNTRY] ipapi.co failed, using default');
      }

      // If all fail, return default
      return this.getDefaultCountry();
    } catch (error) {
      console.error('[COUNTRY] Detection error:', error);
      return this.getDefaultCountry();
    }
  }

  /**
   * Check if IP is private/localhost
   */
  private isPrivateIP(ip: string): boolean {
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      return true;
    }
    
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);
    
    // Private IP ranges
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    
    return false;
  }

  /**
   * Get default country (US)
   */
  private getDefaultCountry(): CountryResult {
    return {
      country_code: 'US',
      country_name: 'United States',
      detected_from: 'default',
    };
  }

  /**
   * Get country name from code (basic mapping)
   */
  getCountryName(code: string): string {
    const countries: Record<string, string> = {
      // North America
      US: 'USA',
      CA: 'Canada',
      MX: 'Mexico',
      
      // Europe
      GB: 'UK',
      DE: 'Germany',
      FR: 'France',
      IT: 'Italy',
      ES: 'Spain',
      NL: 'Netherlands',
      BE: 'Belgium',
      CH: 'Switzerland',
      AT: 'Austria',
      SE: 'Sweden',
      NO: 'Norway',
      DK: 'Denmark',
      FI: 'Finland',
      PL: 'Poland',
      CZ: 'Czechia',
      RO: 'Romania',
      GR: 'Greece',
      PT: 'Portugal',
      IE: 'Ireland',
      
      // Middle East
      IR: 'Iran',
      TR: 'Turkey',
      SA: 'Saudi Arabia',
      AE: 'UAE',
      EG: 'Egypt',
      IQ: 'Iraq',
      JO: 'Jordan',
      LB: 'Lebanon',
      KW: 'Kuwait',
      QA: 'Qatar',
      OM: 'Oman',
      BH: 'Bahrain',
      
      // Asia
      CN: 'China',
      JP: 'Japan',
      KR: 'S. Korea',
      IN: 'India',
      TH: 'Thailand',
      VN: 'Vietnam',
      PH: 'Philippines',
      SG: 'Singapore',
      MY: 'Malaysia',
      ID: 'Indonesia',
      PK: 'Pakistan',
      BD: 'Bangladesh',
      
      // South America
      BR: 'Brazil',
      AR: 'Argentina',
      CL: 'Chile',
      CO: 'Colombia',
      PE: 'Peru',
      VE: 'Venezuela',
      
      // Africa
      ZA: 'S. Africa',
      NG: 'Nigeria',
      KE: 'Kenya',
      GH: 'Ghana',
      ET: 'Ethiopia',
      TZ: 'Tanzania',
      
      // Oceania
      AU: 'Australia',
      NZ: 'New Zealand',
      
      // Other
      RU: 'Russia',
      UA: 'Ukraine',
    };
    
    return countries[code] || code;
  }

  /**
   * Extract IP from request
   */
  getClientIP(req: any): string {
    // Check various headers for real IP
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return req.headers['x-real-ip'] || 
           req.headers['cf-connecting-ip'] ||
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           '127.0.0.1';
  }
}

export const countryDetectionService = new CountryDetectionService();
