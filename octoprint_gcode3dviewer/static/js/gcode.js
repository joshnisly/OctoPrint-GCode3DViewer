function parseGCode(sGcode)
{
    var asGcode = sGcode.split('\n');
    var aiLayersByZHeight = {};
    // Output
    var aModel = [];
    var j, iCurrentLayer = 0;
    var bExtrude=false;
    var prevRetract= {e: 0, a: 0, b: 0, c: 0}, retract=0;
    var prev_extrude = {a: undefined, b: undefined, c: undefined, e: undefined, abs: undefined}, extrudeRelative=false;
    var cCurrentExtruder;
    var dcExtrude=false;
    var assumeNonDC = false;

    var state = {
        x: undefined,
        y: undefined,
        z: undefined,
        prev: {
            x: 0,
            y: 0,
            z: 0
        },
        cExtruder: '',
        bIsExtruding: false
    };

    function handlePositionArgs(argChar, arg, state)
    {
        switch (argChar)
        {
            case 'x':
                state.x = Number(arg.slice(1));
                return true;
            case 'y':
                state.y = Number(arg.slice(1));
                return true;
            case 'z':
                state.z = Number(arg.slice(1));
                if (state.z != state.prev.z)
                {
                    if (state.z in aiLayersByZHeight)
                    {
                        iCurrentLayer = aiLayersByZHeight[state.z];
                    }
                    else
                    {
                        iCurrentLayer = aModel.length;
                        aiLayersByZHeight[state.z] = iCurrentLayer;
                    }
                    state.prev.z = state.z;
                }
                return true;
        }

        return false;
    }

    for(var i=0;i<asGcode.length;i++)
    {
        state.x=null;
        state.y=null;
        state.z=null;
        retract = 0;

        bExtrude=false;
        cCurrentExtruder = null;
        prev_extrude["abs"] = 0;
        var sCode = asGcode[i].split(/[\(;]/)[0];
        var asArgs = sCode.split(/\s/);

        switch (asArgs[0])
        {
            case 'G0':
            case 'G1':
            {
                for (j = 0; j < asArgs.length; j++)
                {
                    var argChar = asArgs[j].charAt(0).toLowerCase();
                    if (handlePositionArgs(argChar, asArgs[j], state))
                        continue;

                    switch (argChar)
                    {
                        case 'e':
                        case 'a':
                        case 'b':
                        case 'c':
                            assumeNonDC = true;
                            cCurrentExtruder = argChar;
                            var numSlice = parseFloat(asArgs[j].slice(1)).toFixed(6);

                            if (!extrudeRelative)
                            {
                                // absolute extrusion positioning
                                prev_extrude["abs"] = parseFloat(numSlice) - parseFloat(prev_extrude[argChar]);

                            }
                            else
                            {
                                prev_extrude["abs"] = parseFloat(numSlice);
                            }
                            bExtrude = prev_extrude["abs"] > 0;
                            if (prev_extrude["abs"] < 0)
                            {
                                prevRetract[cCurrentExtruder] = -1;
                                retract = -1;
                            }
                            else if (prev_extrude["abs"] == 0)
                            {
                                retract = 0;
                            }
                            else if (prev_extrude["abs"] > 0 && prevRetract[cCurrentExtruder] < 0)
                            {
                                prevRetract[cCurrentExtruder] = 0;
                                retract = 1;
                            }
                            else
                            {
                                retract = 0;
                            }
                            prev_extrude[argChar] = numSlice;
                            break;
                        default:
                            break;
                    }
                }
                if (dcExtrude && !assumeNonDC)
                {
                    bExtrude = true;
                    prev_extrude["abs"] = Math.sqrt((state.prev.x - state.x) * (state.prev.x - state.x) + (state.prev.y - state.y) * (state.prev.y - state.y));
                }
                if (!aModel[iCurrentLayer])
                    aModel[iCurrentLayer] = [];
                aModel[iCurrentLayer][aModel[iCurrentLayer].length] = {
                    x: state.x !== null ? state.x : state.prev.x,
                    y: state.y !== null ? state.y : state.prev.y,
                    z: state.z !== null ? state.z : state.prev.z,
                    extrude: bExtrude,
                    retract: Number(retract),
                    noMove: false,
                    extrusion: (bExtrude || retract) ? Number(prev_extrude["abs"]) : 0,
                    extruder: cCurrentExtruder,
                    gcodeLine: Number(i),
                    prevX: state.prev.x,
                    prevY: state.prev.y,
                    prevZ: state.prev.z
                };
                if (state.x !== null) state.prev.x = state.x;
                if (state.y !== null) state.prev.y = state.y;
            }
                break;
            case 'M82':
                extrudeRelative = false;
                break;
            case 'G91':
                extrudeRelative = true;
                break;
            case 'G90':
                extrudeRelative = false;
                break;
            case 'M83':
                extrudeRelative = true;
                break;
            case 'M101':
                dcExtrude = true;
                break;
            case 'M103':
                dcExtrude = false;
                break;

            case 'G92':
            {
                for (j = 0; j < asArgs.length; j++)
                {
                    switch (argChar = asArgs[j].charAt(0).toLowerCase())
                    {
                        case 'x':
                            state.x = Number(asArgs[j].slice(1));
                            break;
                        case 'y':
                            state.y = Number(asArgs[j].slice(1));
                            break;
                        case 'z':
                            state.z = Number(asArgs[j].slice(1));
                            state.prev.z = state.z;
                            break;
                        case 'e':
                        case 'a':
                        case 'b':
                        case 'c':
                            var numSlice = parseFloat(asArgs[j].slice(1)).toFixed(3);
                            cCurrentExtruder = argChar;
                            if (!extrudeRelative)
                                prev_extrude[argChar] = 0;
                            else
                            {
                                prev_extrude[argChar] = numSlice;
                            }
                            break;
                        default:
                            break;
                    }
                }
                if (!aModel[iCurrentLayer]) aModel[iCurrentLayer] = [];
                if (state.x !== null || state.y !== null || state.z !== null)
                {
                    aModel[iCurrentLayer][aModel[iCurrentLayer].length] = {
                        x: state.x !== null ? state.x : state.prev.x,
                        y: state.y !== null ? state.y : state.prev.y,
                        z: state.z !== null ? state.z : state.prev.z,
                        extrude: bExtrude,
                        retract: parseFloat(retract),
                        noMove: true,
                        extrusion: 0,
                        extruder: cCurrentExtruder,
                        gcodeLine: parseFloat(i),
                        prevX: state.prev.x,
                        prevY: state.prev.y,
                        prevZ: state.prev.z
                    };
                }
            }
                break;
            case 'G28':
            {
                for (j = 0; j < asArgs.length; j++)
                    handlePositionArgs(asArgs[j].charAt(0).toLowerCase(), asArgs[j], state);

                // if it's the first iCurrentLayer and G28 was without
                if (iCurrentLayer == 0 && state.z === null)
                {
                    state.z = 0;
                    if (aiLayersByZHeight.hasOwnProperty(state.z))
                    {
                        iCurrentLayer = aiLayersByZHeight[state.z];
                    }
                    else
                    {
                        iCurrentLayer = aModel.length;
                        aiLayersByZHeight[state.z] = iCurrentLayer;
                    }
                    state.prev.z = state.z;
                }

                if (!aModel[iCurrentLayer])
                    aModel[iCurrentLayer] = [];
                aModel[iCurrentLayer][aModel[iCurrentLayer].length] = {
                    x: state.x !== null ? state.x : state.prev.x,
                    y: state.y !== null ? state.y : state.prev.y,
                    z: state.z !== null ? state.z : state.prev.z,
                    extrude: bExtrude,
                    retract: Number(retract),
                    noMove: false,
                    extrusion: (bExtrude || retract) ? Number(prev_extrude["abs"]) : 0,
                    extruder: cCurrentExtruder,
                    gcodeLine: Number(i),
                    prevX: state.prev.x,
                    prevY: state.prev.y,
                    prevZ: state.prev.z
                };
            }
            break;
        }
    }
    return aModel;
}

function removeEmptyLayers(aModel)
{
    for(var i = aModel.length-1; i >= 0; i--)
    {
        var purge = true;
        if (typeof(aModel[i])==='undefined')
            purge = true;
        else
        {
            for(var j=0;j<aModel[i].length;j++)
            {
                if(aModel[i][j].extrude)
                    purge=false;
            }
        }
        if(purge)
            aModel.splice(i,1);
    }
}

