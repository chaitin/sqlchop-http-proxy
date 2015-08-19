#include <node.h>
#include <node_buffer.h>
#include "sqlchop.h"

using namespace v8;

sqlchop_object_t *obj;

void Method(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);
    const char* buf = node::Buffer::Data(args[0]);
    size_t len = node::Buffer::Length(args[0]);
    int result = sqlchop_classify_request(obj, buf, len, NULL, 0, NULL, 0);
    args.GetReturnValue().Set(Boolean::New(isolate, result == SQLCHOP_RET_SQLI));
}

void init(Handle<Object> exports) {
    int ret = sqlchop_init(NULL, &obj);
    if (ret) {
        Isolate *isolate = Isolate::GetCurrent();
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "sqlchop init failed")));
        return;
    }
    NODE_SET_METHOD(exports, "classify", Method);
}

NODE_MODULE(addon, init)
