/**
 * Password Generator Engine
 * 6 built-in methods + custom template support
 */

const PasswordGenerator = (() => {

  /**
   * Extract clean domain name from a URL
   * e.g. "https://www.github.com/login" → "github"
   */
  function extractDomain(url) {
    try {
      let hostname = new URL(url).hostname;
      // Remove www. prefix
      hostname = hostname.replace(/^www\./, '');
      // Get the main domain part (before TLD)
      const parts = hostname.split('.');
      // For things like "co.uk", "com.ng" etc, take the part before
      if (parts.length >= 2) {
        // Simple approach: take the first meaningful part
        return parts[0];
      }
      return hostname;
    } catch (e) {
      // Fallback: try to extract from string
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^.\/?]+)/);
      return match ? match[1] : 'default';
    }
  }

  /**
   * Capitalize first letter of a string
   */
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Reverse a string
   */
  function reverseStr(str) {
    return str.split('').reverse().join('');
  }

  /**
   * Shift vowels to numbers: a→@, e→3, i→1, o→0, u→5
   */
  function vowelShift(str) {
    const map = { 'a': '@', 'e': '3', 'i': '1', 'o': '0', 'u': '5',
                  'A': '@', 'E': '3', 'I': '1', 'O': '0', 'U': '5' };
    return str.split('').map(c => map[c] || c).join('');
  }

  /**
   * QWERTY keyboard shift — shift each letter one key to the right
   */
  function keyboardShift(str) {
    const lower = 'qwertyuiopasdfghjklzxcvbnm';
    const upper = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    const shiftedLower = 'wertyuiop[sdfghjkl;xcvbnm,';
    const shiftedUpper = 'WERTYUIOP{SDFGHJKL:XCVBNM<';
    return str.split('').map(c => {
      let idx = lower.indexOf(c);
      if (idx !== -1) return shiftedLower[idx] || c;
      idx = upper.indexOf(c);
      if (idx !== -1) return shiftedUpper[idx] || c;
      return c;
    }).join('');
  }

  /**
   * Get current year as string
   */
  function getYear() {
    return new Date().getFullYear().toString();
  }

  /**
   * Get last 2 digits of year
   */
  function getYearShort() {
    return getYear().slice(-2);
  }

  // ─── THE 6 METHODS ─────────────────────────────────────

  const methods = {
    /**
     * Method 1: Star-Domain-Year-Hash (User's method)
     * *Domain2026#
     */
    1: {
      name: "Star-Domain-Year-Hash",
      description: "Your method: *Domain2026#",
      example: "*Github2026#",
      generate(domain) {
        return `*${capitalize(domain)}${getYear()}#`;
      }
    },

    /**
     * Method 2: Reverse Domain
     * *buhtiG2026#
     */
    2: {
      name: "Reverse Domain",
      description: "Reversed capitalized domain with year",
      example: "*buhtiG2026#",
      generate(domain) {
        const cap = capitalize(domain);
        return `*${reverseStr(cap)}${getYear()}#`;
      }
    },

    /**
     * Method 3: Domain Split + Length
     * Git#6hub!26
     */
    3: {
      name: "Domain-Split-Length",
      description: "First3 + # + length + last3 + ! + yearShort",
      example: "Git#6hub!26",
      generate(domain) {
        const cap = capitalize(domain);
        const first3 = cap.slice(0, 3);
        const last3 = cap.slice(-3);
        return `${first3}#${domain.length}${last3}!${getYearShort()}`;
      }
    },

    /**
     * Method 4: Vowel Shift
     * *G1th5b2026#
     */
    4: {
      name: "Vowel Shift",
      description: "Vowels replaced with symbols (a→@, e→3, i→1, o→0, u→5)",
      example: "*G1th5b2026#",
      generate(domain) {
        return `*${vowelShift(capitalize(domain))}${getYear()}#`;
      }
    },

    /**
     * Method 5: Keyboard Shift
     * *Hotjiy2026#
     */
    5: {
      name: "Keyboard Shift",
      description: "Each letter shifted one key right on QWERTY",
      example: "*Hotjiy2026#",
      generate(domain) {
        return `*${keyboardShift(capitalize(domain))}${getYear()}#`;
      }
    },

    /**
     * Method 6: Custom Template
     * User-defined pattern using variables
     */
    6: {
      name: "Custom Template",
      description: "Build your own pattern with {domain}, {year}, etc.",
      example: "@{Domain}_{yy}!",
      generate(domain, template) {
        if (!template) template = '*{Domain}{year}#';
        return parseTemplate(template, domain);
      }
    }
  };

  /**
   * Parse a custom template string with variable substitution
   */
  function parseTemplate(template, domain) {
    const cap = capitalize(domain);
    const vars = {
      '{domain}':  domain.toLowerCase(),
      '{Domain}':  cap,
      '{DOMAIN}':  domain.toUpperCase(),
      '{year}':    getYear(),
      '{yy}':      getYearShort(),
      '{len}':     domain.length.toString(),
      '{rev}':     reverseStr(domain.toLowerCase()),
      '{Rev}':     capitalize(reverseStr(domain.toLowerCase())),
      '{REV}':     reverseStr(domain).toUpperCase(),
      '{first3}':  domain.slice(0, 3).toLowerCase(),
      '{First3}':  capitalize(domain.slice(0, 3)),
      '{last3}':   domain.slice(-3).toLowerCase(),
      '{Last3}':   capitalize(domain.slice(-3)),
      '{vowel}':   vowelShift(cap),
      '{kbd}':     keyboardShift(cap),
    };

    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(key, value);
    }
    return result;
  }

  /**
   * Generate a password
   * @param {string} url - The current page URL
   * @param {object} settings - { mode, defaultPassword, method, customTemplate }
   * @returns {string} Generated password
   */
  function generate(url, settings) {
    if (settings.mode === 'default') {
      return settings.defaultPassword || '';
    }

    const domain = extractDomain(url);
    const methodId = settings.method || 1;
    const method = methods[methodId];

    if (!method) return '';

    if (methodId === 6) {
      return method.generate(domain, settings.customTemplate);
    }

    return method.generate(domain);
  }

  /**
   * Preview a password for a given domain string (used in popup)
   */
  function preview(domainStr, methodId, customTemplate) {
    const method = methods[methodId];
    if (!method) return '';
    if (methodId === 6) {
      return method.generate(domainStr, customTemplate);
    }
    return method.generate(domainStr);
  }

  return {
    generate,
    preview,
    extractDomain,
    methods,
    parseTemplate,
    capitalize,
    reverseStr,
    vowelShift,
    keyboardShift
  };

})();

// Make available in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PasswordGenerator;
}
