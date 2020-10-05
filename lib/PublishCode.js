const PublishCode = {
    start: -1, // 开始发布
    success: 0, // 成功
    busy: 1, // 当前正在发布
    not_exists: 2, // 路径不存在
    not_init: 3, // 没有编辑过
    id_exists: 4, // id已经存在
    input_error: 5, // 输入有误
};

module.exports = PublishCode;