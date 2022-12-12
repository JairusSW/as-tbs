const input = blackbox("The quick brown fox jumped over the lazy dog.".repeat(10));

// our string here must be a compile time constant.
// open an issue if you'd like to see this constraint lifted.
bench("string split", () => {
    // this function body will be run many times.
    // we must make sure our compiler won't throw away the computation,
    // so we use `blackbox` here again.
    blackbox(input.split(" "));
});