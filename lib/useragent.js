/**
 * Library dependencies.
 */

var agents = require('./agents');

/**
 * The representation of a parsed user agent.
 *
 * @constructor
 * @param {String} family The name of the browser
 * @param {String} major Major version of the browser
 * @param {String} minor Minor version of the browser
 * @param {String} patch Patch version of the browser
 * @param {String} os Operating system
 * @api public
 */

function Agent (family, major, minor, patch, os) {
  this.family = family || 'Other';
  this.major = major || '0';
  this.minor = minor || '0';
  this.patch = patch || '0';
  this.os = os || 'Other';
}

/**
 * Generates a string output of the parsed user agent.
 *
 * @returns {String}
 * @api public
 */

Agent.prototype.toAgent = function toAgent () {
  var output = this.family
    , version = this.toVersion();

  if (version) output += ' ' + version;
  return output;
};

/**
 * Generates a string output of the parser user agent and operating system.
 *
 * @returns {String}  "UserAgent 0.0.0 / OS"
 * @api public
 */

Agent.prototype.toString = function toString () {
  var agent = this.toAgent()
    , os = this.os !== 'Other' ? this.os : false;

  return agent + (os ? ' / ' + os : '');
};

/**
 * Outputs a compiled veersion number of the user agent.
 *
 * @returns {String}
 * @api public
 */

Agent.prototype.toVersion = function toVersion () {
  var version = '';

  if (this.major) {
    version += this.major;
    if (this.minor) {
     version += '.' + this.minor;
     // special case here, the patch can also be Alpha, Beta etc so we need
     // to check if it's a string or not.
     if (this.patch) {
      version += (isNaN(+this.patch) ? ' ' : '.') + this.patch;
     }
    }
  }

  return version;
};

/**
 * Outputs a JSON string of the Agent
 *
 * @returns {String}
 * @api public
 */

Agent.prototype.toJSON = function toJSON () {
  return JSON.stringify({
      family: this.family
    , major: this.major
    , minor: this.minor
    , patch: this.patch
    , os: this.os
  });
};

/**
 * Parses the user agent string with the generated parsers from the
 * ua-parser project on google code.
 *
 * @param {String} useragent The user agent string
 * @param {String} jsagent Optional UA from js to detect chrome frame
 * @returns {Agent}
 * @api public
 */

function parse (useragent, jsagent) {
  var ua, os, i
    , browsers = parse.browsers
    , oss = parse.os
    , ualength = parse.ua_length
    , oslength = parse.os_length;

  // find the user agent
  for (i = 0; i < ualength; i++) {
    if (ua = useragent.match(browsers[i].r)) {
      var browser = browsers[i];
      if (browser.family) ua[1] = browser.family.replace('$1', ua[1]);
      if (browser.major) ua[2] = browser.major;

      break;
    }
  }

  // find the os
  for (i = 0; i < oslength; i++) {
    if (os = useragent.match(oss[i].r)) {
      os[1] = oss[i].os || os[1];
      break;
    }
  }

  ua = ua || [];
  os = os || [];

  // detect chrome frame, but make sure it's enabled! So we need to check for
  // the Chrome/ so we know that it's actually using Chrome under the hood
  if (jsagent && 
      (jsagent.indexOf('Chrome/') !== -1 && useragent.indexOf('chromeframe') !== -1)
  ) {
    ua[1] = 'Chrome Frame (' + ua[1] + ' ' + ua[2] + ')';
    parser = parse(jsagent);

    // update to the new correct version numbers of chrome frame
    ua[2] = parser.major;
    ua[3] = parser.minor;
    ua[4] = parser.patch;
  }

  return new Agent(ua[1], ua[2], ua[3], ua[4], os[1]);
}

/**
 * Quick lookup references, object lookups are faster than global lookup
 */

parse.browsers = agents.browser;
parse.os = agents.os;
parse.ua_length = parse.browsers.length;
parse.os_length = parse.os.length;

/**
 * Small nifty thick that allows us to download a fresh set regexs from t3h
 * Int3rNetz when we want to. We will be using the compiled version by default
 * but users can opt-in for updates.
 *
 * @api public
 */

function updater (refresh) {
  // check if we need to refresh the code from the live servers this does not
  // impact the rest of the library, it will just update the `agents` code.
  if (refresh) {
    require('./update')(function (err, set) {
      if (err) return; // use old set on error

      // update our agents and lenghts
      agents = set;

      // update the references to the browsers
      browsers = agents.browser;
      oss = agents.os;

      // count the browsers and operating systems again
      ua_length = browsers.length;
      os_length = oss.length;
    });
  }
}

/**
 * Does a more inaccurate but more common check for useragents identification.
 * The version detection is from the jQuery.com library and is licensed under
 * MIT.
 *
 * @param {String} useragent The user agent
 * @returns {Object} matches
 * @api public
 */

function is (useragent) {
  var ua = useragent.toLowerCase()
    , details = {
        version: (ua.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [0, "0"])[1]
      , webkit: ua.indexOf('webkit') !== -1
      , opera: ua.indexOf('opera') !== -1
    };

  // the following checks depend on our findings from above
  details.ie = ua.indexOf('msie') && !details.opera;
  details.chrome = ua.indexOf('chrome') !== -1 && details.webkit;
  details.safari = ua.indexOf('safari') !== -1 && !details.chrome;
  details.mobile_safari = ua.indexOf('apple') !== -1
    && ua.indexOf('mobile') !== -1 && details.safari;
  details.firefox = ua.indexOf('mozilla') !== -1
    && !(details.webkit || ua.indexOf('compatible') !== -1);

  return details;
}

/**
 * Library version.
 */

updater.version = '0.2.0';

/**
 * Expose the Agent constructor.
 *
 * @api private
 */

updater.Agent = Agent;

/**
 * Expose the useragent parser.
 *
 * @api public
 */

updater.parse = parse;

/**
 * Expose our quick useragent tester
 *
 * @api public
 */

updater.is = is;

/**
 * Expose the updater.
 *
 * @api public
 */

module.exports = updater;