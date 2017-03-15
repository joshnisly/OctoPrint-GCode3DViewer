var _aClosureCache = [];
function createCallback(/*oObject, callback, aArgumentsOverride*/)
{
    // cache the parameters in the member variable
    var iID = _aClosureCache.push(arguments)-1;

    return function()
        {
            var oArguments = _aClosureCache[iID];
            var oObject = oArguments[0];
            var callback = oArguments[1];
            var aArgumentsOverride = oArguments[2];
            
            // If we have both normal arguments and an arguments override, pass in the normal arguments at the end
            if (aArgumentsOverride)
            {
                // Copy arguments array, so that the array is not affected for the next call.
                aArgumentsOverride = aArgumentsOverride.concat([]);
                for (var i = 0; i < arguments.length; i++)
                    aArgumentsOverride.push(arguments[i]);
            }

            return callback.apply(oObject, aArgumentsOverride || arguments);
        };
}