/*
 * View model for OctoPrint-GCodeViewer
 *
 * Author: Josh Nisly
 * License: AGPLv3
 */
$(function() {
    function OctoprintViewModel(parameters) {
        var self = this;

        // assign the injected parameters, e.g.:
        // self.loginStateViewModel = parameters[0];
        // self.settingsViewModel = parameters[1];

        this._lastLoadedModel = null;


        self.loadFile = function(path, date)
        {
        };

        self.fromCurrentData = function(data)
        {
            self._loadModel(data);
        };

        self.fromHistoryData = function(data)
        {
        };

        self._loadModel = function(data)
        {
            if (data.job.file.path != self._lastLoadedModel)
            {
                self._lastLoadedModel = data.job.file.path;
                OctoPrint.files.download(data.job.file.origin, data.job.file.path)
                    .done(function(response, rstatus) {
                        if(rstatus === 'success'){
                            self._displayModel(response);
                        }
                    })
                    .fail(function() {
                        self._lastLoadedModel = null;
                    });
            }
        };

        self._displayModel = function(gcode)
        {
            var model = parseGCode(gcode);
            var renderer = new ModelRenderer($('#ThreeDViewContainer')[0], {
                iWidth: 585,
                iHeight: 480
            });
            renderer.loadModel(model);

        };
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        OctoprintViewModel,

        // e.g. loginStateViewModel, settingsViewModel, ...
        [ /* "loginStateViewModel", "settingsViewModel" */ ],

        // e.g. #settings_plugin_octoprint, #tab_plugin_octoprint, ...
        [ /* ... */ ]
    ]);
});
