function mergeArgs(start, args) {
    return args.slice(start).join(" ").trim();
}

module.exports = {
    mergeArgs
};