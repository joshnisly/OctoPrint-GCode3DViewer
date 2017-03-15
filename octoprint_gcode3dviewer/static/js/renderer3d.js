/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/21/12
 * Time: 4:59 PM
 */

function ModelRenderer(dElem, oRenderOptions)
{
    this.dElem = dElem;
    this.oRenderOptions = oRenderOptions || {};
    this.oRenderOptions.iLineColor = this.oRenderOptions.iLineColor || 0x404040;
    this.oRenderOptions.iWidth = this.oRenderOptions.iWidth || this.dElem.clientWidth;
    this.oRenderOptions.iHeight = this.oRenderOptions.iHeight || this.dElem.clientHeight;

    var fAspect = this.oRenderOptions.iWidth / this.oRenderOptions.iHeight;
    this.camera = new THREE.PerspectiveCamera(60, fAspect, 1, 1000);
    this.controls = new THREE.OrbitControls(this.camera, dElem);
    this.controls.enableRotate = false;
    this.controls.enablePan = true;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    this.camera.position.z = 400;
    this.scene.add(this.camera);
    this.renderer = new THREE.WebGLRenderer({
        clearColor: 0xffffff,
        clearAlpha: 1
    });
    this.renderer.setSize(this.oRenderOptions.iWidth, this.oRenderOptions.iHeight);
    $(dElem).empty();
    $(dElem).append(this.renderer.domElement);

    this.object = new THREE.Object3D();
    this.fnRenderFrameFn = createCallback(this, this._renderFrame);
    this.object.rotateX(-0.5);
    this.scene.add(this.object);

    this.rotater = new ObjectRotater(this.object, this.camera, dElem);
}

ModelRenderer.prototype.loadModel = function(aModel)
{
    var aOffset = this._determinePrintOffset(aModel);

    var lineMaterial = new THREE.LineBasicMaterial({
        color: this.oRenderOptions.iLineColor,
        opacity: 0.6,
        fog: true
    });

    for(var iLayer = 0; iLayer < aModel.length; iLayer++)
        this._renderModelLayer(aModel[iLayer], aOffset, lineMaterial);

    this._renderFrame();
};

ModelRenderer.prototype._renderModelLayer = function(aCmds, aOffsetAdjust, lineMaterial)
{
    var vectors = [];
    for (var j = 0; j < aCmds.length; j++)
    {
        if (!aCmds[j].extrude)
        {
            if (vectors.length)
            {
                var lineGeometry = new THREE.Geometry();
                for (var i = 0; i < vectors.length; i++)
                    lineGeometry.vertices.push(new THREE.Vector3(vectors[i][0], vectors[i][1], vectors[i][2]));

                this.object.add(new THREE.Line(lineGeometry, lineMaterial));
                vectors = [];
            }
        }
        else if (aCmds[j].z)
        {
            var point = [aCmds[j].x-aOffsetAdjust[0], aCmds[j].y-aOffsetAdjust[1], aCmds[j].z-aOffsetAdjust[2]];
            vectors.push(point);
        }
    }
};

ModelRenderer.prototype._determinePrintOffset = function(aModel)
{
    function _update(accum, data, fn)
    {
        for (var i = 0; i < accum.length; i++)
        {
            if (data[i])
                accum[i] = fn(accum[i], data[i]);
        }
    }

    var min = [250, 250, 250];
    var max = [0, 0, 0];
    for(var i = 0; i < aModel.length; i += 1)
    {
        var aLayerCmds = aModel[i];
        for (var j = 0; j < aLayerCmds.length; j++)
        {
            if (aLayerCmds[j] && aLayerCmds[j].extrude && aLayerCmds[j].z)
            {
                var point = [aLayerCmds[j].x, aLayerCmds[j].y, aLayerCmds[j].z];
                //console.log(point);
                _update(min, point, Math.min);
                _update(max, point, Math.max);
            }
        }
    }

    return [
        min[0] + ((max[0] - min[0]) / 2),
        min[1] + ((max[1] - min[1]) / 2),
        min[2] + ((max[2] - min[2]) / 2)
    ];
};

ModelRenderer.prototype._renderFrame = function()
{
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.fnRenderFrameFn);
};

function ObjectRotater(oObject, oCamera, dContainer)
{
    this._bRotate = false;
    this._oObject = oObject;
    this._oCamera = oCamera;
    console.log('dContainer', dContainer);
    $(dContainer).bind('mousedown', createCallback(this, this._onMouseDown));
    $(dContainer).bind('mouseup', createCallback(this, this._onMouseUp));
    $(dContainer).bind('mousemove', createCallback(this, this._onMouseMove));

    this._lastPoint = [null, null]
}

ObjectRotater.prototype._onMouseDown = function(event)
{
    this._bRotate = true;
    console.log(event.clientX, event.clientY);
    this._lastPoint = [event.clientX, event.clientY];
};

ObjectRotater.prototype._onMouseUp = function()
{
    this._bRotate = false;
};

ObjectRotater.prototype._onMouseMove = function(event)
{
    if (this._bRotate && event.button == 0)
    {
        this._oObject.rotateZ((event.clientX-this._lastPoint[0]) / 100);
        this._oCamera.translateY((event.clientY-this._lastPoint[1]) * 2);

        this._lastPoint = [event.clientX, event.clientY];
    }
};

