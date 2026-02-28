export var postThreadQueryKeyRoot = 'post-thread-v2';
export var createPostThreadQueryKey = function (props) {
    return [postThreadQueryKeyRoot, props];
};
export var createPostThreadOtherQueryKey = function (props) { return [postThreadQueryKeyRoot, 'other', props]; };
