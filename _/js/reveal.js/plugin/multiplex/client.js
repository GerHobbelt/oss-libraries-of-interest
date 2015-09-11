(function() {
    var multiplex = Reveal.getConfig().multiplex;
    var socketId = multiplex.id;
    var socket = io.connect(multiplex.url);

    socket.on(multiplex.id, function(data) {
        // ignore data from sockets that aren't ours
        if (data.socketId !== socketId) { return; }
        if( window.location.host === 'localhost:1947' ) return;

        Reveal.slide(data.indexh, data.indexv, data.indexf, 'remote');
    });
}());
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
