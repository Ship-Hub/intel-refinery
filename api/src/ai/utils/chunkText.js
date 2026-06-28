const MAX_CHUNK_SIZE =
  12000;

const chunkText =
  (text = "") => {

    const chunks = [];

    for (
      let i = 0;
      i < text.length;
      i += MAX_CHUNK_SIZE
    ) {

      chunks.push(
        text.slice(
          i,
          i + MAX_CHUNK_SIZE
        )
      );

    }

    return chunks;

};

module.exports = {
  chunkText
};