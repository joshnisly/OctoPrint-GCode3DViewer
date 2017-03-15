#!/usr/bin/python

from __future__ import absolute_import

import octoprint.plugin


class GCode3DViewerPlugin(octoprint.plugin.TemplatePlugin, octoprint.plugin.AssetPlugin):
    def get_template_configs(self):
        return [
            dict(type="tab", name="3D view", template="gcode3dviewer_tab.jinja2")
        ]

    def get_assets(self):
        return dict(
            js=[
                'js/lib/three.min.js',
                'js/lib/OrbitControls.js',
                'js/gcode.js',
                'js/globals.js',
                'js/renderer3d.js',
                'js/gcode3dviewer.js'
            ],
            css=["css/gcode3dviewer.css"]
        )


__plugin_implementation__ = GCode3DViewerPlugin()
