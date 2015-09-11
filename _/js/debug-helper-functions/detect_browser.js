//
// Detect browser name and version
//
// taken from 
//      http://stackoverflow.com/questions/5916900/detect-version-of-browser/5916928
// testdata at:
//      http://www.useragentstring.com/pages/Safari/
//     

function get_browser_info() {
    var ua = navigator.userAgent;
    var tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
    var rv;

    // IE11 detection:
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    rv = M[2] ? {
        browser: M[1], 
        version: M[2]
    } : {
        browser: navigator.appName, 
        version: navigator.appVersion, 
        unidentified: true
    };
    tem = ua.match(/version\/([\.\d]+)/i);
    if (tem != null) {
        rv.version = tem[1];
    }
    return rv;
}


// Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25
// Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
