'use strict';

var Promise = require('bluebird');
var ld = require('lodash');
var requireDir = require('require-dir');

/**
 * simple error serializer/deserializer
 * things to improve:
 * - pull error (instead new stack will be created on `new`)
 * - handle .toJSON behaviour
 * - handle circular links
 * - check if buffer passed instead of json
 */
function serializeError(err) {
  if (err instanceof Error) {
    var resError = ld.pick(err, ['name', 'code', 'message', 'statusCode', 'payload']);
    resError.stack = err.stack.split('\n').slice(0, 6).join('\n');
    return resError;
  }
  return err;
}

function deserializeError(obj) {
  var err = new Error(obj.message);
  for (var name in obj) {
    err[name] = obj[name];
  }
  return err;
}

module.exports = {

  serializeError: serializeError, deserializeError: deserializeError,

  loadPlugins: function loadPlugins(path, seneca, config) {
    var plugins = requireDir(path, { recurse: true });
    return Promise.each(Object.keys(plugins), function (name) {
      var item = plugins[name].index || plugins[name];
      if (!item.seneca) {
        return;
      }
      return (item.preload || Promise.resolve)(config).then(function () {
        return seneca.use(item.seneca);
      });
    });
  },


  /**
   * replace default senecajs logger with custom
   */
  createSenecaLogger: function createSenecaLogger(customLogger) {
    // https://github.com/senecajs/seneca/blob/master/docs/examples/custom-logger.js
    function SenecaLogger() {}
    SenecaLogger.preload = function () {
      return {
        extend: {
          logger: function logger(context, payload) {
            // [ 'actid', 'msg', 'entry', 'prior', 'gate', 'caller', 'meta', 'client','listen', 'transport', 'kind', 'case',
            // 'duration', 'result', 'level', 'plugin_name', 'plugin_tag', 'pattern', 'seneca', 'when' ]
            customLogger[payload.level](payload);
          }
        }
      };
    };
    return SenecaLogger;
  },


  /**
   * append additional methods into seneca instanse: promisifed actions, common error emitter etc
   */
  decorateSeneca: function decorateSeneca(seneca, logger) {
    var act = function act() {
      for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
        data[_key] = arguments[_key];
      }

      var callback = typeof data[data.length - 1] === 'function' ? data.pop() : ld.noop;

      // sugar stuff: remove from route arguments passed as payload
      if (data.length > 1) {
        var payload = data[data.length - 1];
        if (ld.isPlainObject(data[0]) && ld.isPlainObject(payload)) {
          data[0] = ld.omit(data[0], Object.keys(payload));
        }
      }

      // emit error from data, temporal workaround:
      // https://github.com/senecajs/seneca/issues/523#issuecomment-245712042
      seneca.act.apply(seneca, data.concat([function (err, res) {
        if (err) {
          return callback(err);
        }
        // 2do: !!! find how to pass additional error fields to seneca error (ex: .payload is not passed)
        if (res && res.error) {
          return callback(deserializeError(res.error));
        }
        callback(null, res);
      }]));
    };

    // send stringified error to remote host
    var emitError = function emitError(error, callback) {
      callback(null, {
        error: serializeError(error)
      });
    };

    seneca.decorate('actAsync', Promise.promisify(act, { context: seneca }));
    seneca.decorate('actCustom', act);
    seneca.decorate('emitError', emitError);
    seneca.decorate('logger', logger); // append clean logger without all seneca-specific stuff
    return seneca;
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy5qcyJdLCJuYW1lcyI6WyJQcm9taXNlIiwicmVxdWlyZSIsImxkIiwicmVxdWlyZURpciIsInNlcmlhbGl6ZUVycm9yIiwiZXJyIiwiRXJyb3IiLCJyZXNFcnJvciIsInBpY2siLCJzdGFjayIsInNwbGl0Iiwic2xpY2UiLCJqb2luIiwiZGVzZXJpYWxpemVFcnJvciIsIm9iaiIsIm1lc3NhZ2UiLCJuYW1lIiwibW9kdWxlIiwiZXhwb3J0cyIsImxvYWRQbHVnaW5zIiwicGF0aCIsInNlbmVjYSIsImNvbmZpZyIsInBsdWdpbnMiLCJyZWN1cnNlIiwiZWFjaCIsIk9iamVjdCIsImtleXMiLCJpdGVtIiwiaW5kZXgiLCJwcmVsb2FkIiwicmVzb2x2ZSIsInRoZW4iLCJ1c2UiLCJjcmVhdGVTZW5lY2FMb2dnZXIiLCJjdXN0b21Mb2dnZXIiLCJTZW5lY2FMb2dnZXIiLCJleHRlbmQiLCJsb2dnZXIiLCJjb250ZXh0IiwicGF5bG9hZCIsImxldmVsIiwiZGVjb3JhdGVTZW5lY2EiLCJhY3QiLCJkYXRhIiwiY2FsbGJhY2siLCJsZW5ndGgiLCJwb3AiLCJub29wIiwiaXNQbGFpbk9iamVjdCIsIm9taXQiLCJyZXMiLCJlcnJvciIsImVtaXRFcnJvciIsImRlY29yYXRlIiwicHJvbWlzaWZ5Il0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLFVBQVVDLFFBQVEsVUFBUixDQUFoQjtBQUNBLElBQU1DLEtBQUtELFFBQVEsUUFBUixDQUFYO0FBQ0EsSUFBTUUsYUFBYUYsUUFBUSxhQUFSLENBQW5COztBQUVBOzs7Ozs7OztBQVFBLFNBQVNHLGNBQVQsQ0FBd0JDLEdBQXhCLEVBQTZCO0FBQzNCLE1BQUlBLGVBQWVDLEtBQW5CLEVBQTBCO0FBQ3hCLFFBQU1DLFdBQVdMLEdBQUdNLElBQUgsQ0FBUUgsR0FBUixFQUFhLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsU0FBakIsRUFBNEIsWUFBNUIsRUFBMEMsU0FBMUMsQ0FBYixDQUFqQjtBQUNB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QUFULENBQVA7QUFBc0I7QUFDakM7QUFDQSxZQUFJOEMsT0FBT0EsSUFBSUMsS0FBZixFQUFzQjtBQUFFLGlCQUFPUCxTQUFTaEMsaUJBQWlCc0MsSUFBSUMsS0FBckIsQ0FBVCxDQUFQO0FBQThDO0FBQ3RFUCxpQkFBUyxJQUFULEVBQWVNLEdBQWY7QUFDRCxPQUxEO0FBTUQsS0FuQkQ7O0FBcUJBO0FBQ0EsUUFBTUUsWUFBWSxTQUFaQSxTQUFZLENBQUNELEtBQUQsRUFBUVAsUUFBUixFQUFxQjtBQUNyQ0EsZUFBUyxJQUFULEVBQWU7QUFDYk8sZUFBT2hELGVBQWVnRCxLQUFmO0FBRE0sT0FBZjtBQUdELEtBSkQ7O0FBT0EvQixXQUFPaUMsUUFBUCxDQUFnQixVQUFoQixFQUE0QnRELFFBQVF1RCxTQUFSLENBQWtCWixHQUFsQixFQUF1QixFQUFDSixTQUFTbEIsTUFBVixFQUF2QixDQUE1QjtBQUNBQSxXQUFPaUMsUUFBUCxDQUFnQixXQUFoQixFQUE2QlgsR0FBN0I7QUFDQXRCLFdBQU9pQyxRQUFQLENBQWdCLFdBQWhCLEVBQTZCRCxTQUE3QjtBQUNBaEMsV0FBT2lDLFFBQVAsQ0FBZ0IsUUFBaEIsRUFBMEJoQixNQUExQixFQWpDNkIsQ0FpQ0s7QUFDbEMsV0FBT2pCLE1BQVA7QUFDRDtBQXZFYyxDQUFqQiIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpXG5jb25zdCBsZCA9IHJlcXVpcmUoJ2xvZGFzaCcpXG5jb25zdCByZXF1aXJlRGlyID0gcmVxdWlyZSgncmVxdWlyZS1kaXInKVxuXG4vKipcbiAqIHNpbXBsZSBlcnJvciBzZXJpYWxpemVyL2Rlc2VyaWFsaXplclxuICogdGhpbmdzIHRvIGltcHJvdmU6XG4gKiAtIHB1bGwgZXJyb3IgKGluc3RlYWQgbmV3IHN0YWNrIHdpbGwgYmUgY3JlYXRlZCBvbiBgbmV3YClcbiAqIC0gaGFuZGxlIC50b0pTT04gYmVoYXZpb3VyXG4gKiAtIGhhbmRsZSBjaXJjdWxhciBsaW5rc1xuICogLSBjaGVjayBpZiBidWZmZXIgcGFzc2VkIGluc3RlYWQgb2YganNvblxuICovXG5mdW5jdGlvbiBzZXJpYWxpemVFcnJvcihlcnIpIHtcbiAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgY29uc3QgcmVzRXJyb3IgPSBsZC5waWNrKGVyciwgWyduYW1lJywgJ2NvZGUnLCAnbWVzc2FnZScsICdzdGF0dXNDb2RlJywgJ3BheWxvYWQnXSlcbiAgICByZXNFcnJvci5zdGFjayA9IGVyci5zdGFjay5zcGxpdCgnXFxuJykuc2xpY2UoMCwgNikuam9pbignXFxuJylcbiAgICByZXR1cm4gcmVzRXJyb3JcbiAgfVxuICByZXR1cm4gZXJyXG59XG5cbmZ1bmN0aW9uIGRlc2VyaWFsaXplRXJyb3Iob2JqKSB7XG4gIGNvbnN0IGVyciA9IG5ldyBFcnJvcihvYmoubWVzc2FnZSlcbiAgZm9yKGxldCBuYW1lIGluIG9iaikge1xuICAgIGVycltuYW1lXSA9IG9ialtuYW1lXVxuICB9XG4gIHJldHVybiBlcnJcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgc2VyaWFsaXplRXJyb3IsIGRlc2VyaWFsaXplRXJyb3IsXG5cbiAgbG9hZFBsdWdpbnMocGF0aCwgc2VuZWNhLCBjb25maWcpIHtcbiAgICBjb25zdCBwbHVnaW5zID0gcmVxdWlyZURpcihwYXRoLCB7cmVjdXJzZTogdHJ1ZX0pXG4gICAgcmV0dXJuIFByb21pc2UuZWFjaChPYmplY3Qua2V5cyhwbHVnaW5zKSwgbmFtZSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gcGx1Z2luc1tuYW1lXS5pbmRleCB8fCBwbHVnaW5zW25hbWVdXG4gICAgICBpZiAoIWl0ZW0uc2VuZWNhKSB7IHJldHVybiB9XG4gICAgICByZXR1cm4gKGl0ZW0ucHJlbG9hZCB8fCBQcm9taXNlLnJlc29sdmUpKGNvbmZpZykudGhlbigoKSA9PiBzZW5lY2EudXNlKGl0ZW0uc2VuZWNhKSlcbiAgICB9KVxuICB9LFxuXG4vKipcbiAqIHJlcGxhY2UgZGVmYXVsdCBzZW5lY2FqcyBsb2dnZXIgd2l0aCBjdXN0b21cbiAqL1xuICBjcmVhdGVTZW5lY2FMb2dnZXIoY3VzdG9tTG9nZ2VyKSB7XG5cdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3NlbmVjYWpzL3NlbmVjYS9ibG9iL21hc3Rlci9kb2NzL2V4YW1wbGVzL2N1c3RvbS1sb2dnZXIuanNcblx0XHRmdW5jdGlvbiBTZW5lY2FMb2dnZXIgKCkge31cblx0XHRTZW5lY2FMb2dnZXIucHJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGV4dGVuZDoge1xuXHRcdFx0XHRcdGxvZ2dlcjogKGNvbnRleHQsIHBheWxvYWQpID0+IHtcbi8vIFsgJ2FjdGlkJywgJ21zZycsICdlbnRyeScsICdwcmlvcicsICdnYXRlJywgJ2NhbGxlcicsICdtZXRhJywgJ2NsaWVudCcsJ2xpc3RlbicsICd0cmFuc3BvcnQnLCAna2luZCcsICdjYXNlJyxcbi8vICdkdXJhdGlvbicsICdyZXN1bHQnLCAnbGV2ZWwnLCAncGx1Z2luX25hbWUnLCAncGx1Z2luX3RhZycsICdwYXR0ZXJuJywgJ3NlbmVjYScsICd3aGVuJyBdXG5cdFx0XHRcdFx0XHRjdXN0b21Mb2dnZXJbcGF5bG9hZC5sZXZlbF0ocGF5bG9hZClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIFNlbmVjYUxvZ2dlclxuXHR9LFxuXG4vKipcbiAqIGFwcGVuZCBhZGRpdGlvbmFsIG1ldGhvZHMgaW50byBzZW5lY2EgaW5zdGFuc2U6IHByb21pc2lmZWQgYWN0aW9ucywgY29tbW9uIGVycm9yIGVtaXR0ZXIgZXRjXG4gKi9cbiAgZGVjb3JhdGVTZW5lY2Eoc2VuZWNhLCBsb2dnZXIpIHtcbiAgICBjb25zdCBhY3QgPSAoLi4uZGF0YSkgPT4ge1xuICAgICAgY29uc3QgY2FsbGJhY2sgPSB0eXBlb2YgZGF0YVtkYXRhLmxlbmd0aCAtIDFdID09PSAnZnVuY3Rpb24nID8gZGF0YS5wb3AoKSA6IGxkLm5vb3BcblxuICAgICAgLy8gc3VnYXIgc3R1ZmY6IHJlbW92ZSBmcm9tIHJvdXRlIGFyZ3VtZW50cyBwYXNzZWQgYXMgcGF5bG9hZFxuICAgICAgaWYgKGRhdGEubGVuZ3RoID4gMSkge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0gZGF0YVtkYXRhLmxlbmd0aCAtIDFdXG4gICAgICAgIGlmIChsZC5pc1BsYWluT2JqZWN0KGRhdGFbMF0pICYmIGxkLmlzUGxhaW5PYmplY3QocGF5bG9hZCkpIHtcbiAgICAgICAgICBkYXRhWzBdID0gbGQub21pdChkYXRhWzBdLCBPYmplY3Qua2V5cyhwYXlsb2FkKSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IGVycm9yIGZyb20gZGF0YSwgdGVtcG9yYWwgd29ya2Fyb3VuZDpcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zZW5lY2Fqcy9zZW5lY2EvaXNzdWVzLzUyMyNpc3N1ZWNvbW1lbnQtMjQ1NzEyMDQyXG4gICAgICBzZW5lY2EuYWN0KC4uLmRhdGEsIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7IHJldHVybiBjYWxsYmFjayhlcnIpIH1cbiAgICAgICAgLy8gMmRvOiAhISEgZmluZCBob3cgdG8gcGFzcyBhZGRpdGlvbmFsIGVycm9yIGZpZWxkcyB0byBzZW5lY2EgZXJyb3IgKGV4OiAucGF5bG9hZCBpcyBub3QgcGFzc2VkKVxuICAgICAgICBpZiAocmVzICYmIHJlcy5lcnJvcikgeyByZXR1cm4gY2FsbGJhY2soZGVzZXJpYWxpemVFcnJvcihyZXMuZXJyb3IpKSB9XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gc2VuZCBzdHJpbmdpZmllZCBlcnJvciB0byByZW1vdGUgaG9zdFxuICAgIGNvbnN0IGVtaXRFcnJvciA9IChlcnJvciwgY2FsbGJhY2spID0+IHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgZXJyb3I6IHNlcmlhbGl6ZUVycm9yKGVycm9yKVxuICAgICAgfSlcbiAgICB9XG5cblxuICAgIHNlbmVjYS5kZWNvcmF0ZSgnYWN0QXN5bmMnLCBQcm9taXNlLnByb21pc2lmeShhY3QsIHtjb250ZXh0OiBzZW5lY2F9KSlcbiAgICBzZW5lY2EuZGVjb3JhdGUoJ2FjdEN1c3RvbScsIGFjdClcbiAgICBzZW5lY2EuZGVjb3JhdGUoJ2VtaXRFcnJvcicsIGVtaXRFcnJvcilcbiAgICBzZW5lY2EuZGVjb3JhdGUoJ2xvZ2dlcicsIGxvZ2dlcikgLy8gYXBwZW5kIGNsZWFuIGxvZ2dlciB3aXRob3V0IGFsbCBzZW5lY2Etc3BlY2lmaWMgc3R1ZmZcbiAgICByZXR1cm4gc2VuZWNhXG4gIH1cbn1cbiJdfQ==