// Sentence embeddings with all-MiniLM-L6-v2 (Apache-2.0), running locally.
// Works in the browser (onnxruntime-web) and in Node (onnxruntime-node, used to build the index).

export class WordPiece {
  constructor(vocabText) {
    this.vocab = new Map();
    vocabText.split("\n").forEach((tok, i) => {
      if (tok) this.vocab.set(tok.replace(/\r$/, ""), i);
    });
    this.cls = this.vocab.get("[CLS]");
    this.sep = this.vocab.get("[SEP]");
    this.unk = this.vocab.get("[UNK]");
  }
  basic(text) {
    text = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const out = [];
    for (const w of text.split(/\s+/)) {
      if (!w) continue;
      let cur = "";
      for (const ch of w) {
        if (/[\p{P}\p{S}]/u.test(ch)) {
          if (cur) out.push(cur);
          out.push(ch);
          cur = "";
        } else cur += ch;
      }
      if (cur) out.push(cur);
    }
    return out;
  }
  encode(text, maxLen = 256) {
    const ids = [this.cls];
    for (const word of this.basic(text)) {
      if (word.length > 100) {
        ids.push(this.unk);
        continue;
      }
      const pieces = [];
      let start = 0;
      let bad = false;
      while (start < word.length) {
        let end = word.length;
        let found = null;
        while (start < end) {
          const sub = (start > 0 ? "##" : "") + word.slice(start, end);
          if (this.vocab.has(sub)) {
            found = this.vocab.get(sub);
            break;
          }
          end--;
        }
        if (found == null) {
          bad = true;
          break;
        }
        pieces.push(found);
        start = end;
      }
      if (bad) ids.push(this.unk);
      else ids.push(...pieces);
      if (ids.length >= maxLen - 1) break;
    }
    ids.length = Math.min(ids.length, maxLen - 1);
    ids.push(this.sep);
    return ids;
  }
}

// Run the model on a batch of texts; returns L2-normalised vectors (mean or [CLS] pooling).
export async function embedBatch(ort, session, tok, texts, pooling = "mean") {
  const encs = texts.map((t) => tok.encode(t));
  const L = Math.max(...encs.map((e) => e.length));
  const B = encs.length;
  const ids = new BigInt64Array(B * L);
  const mask = new BigInt64Array(B * L);
  encs.forEach((e, i) => e.forEach((id, j) => ((ids[i * L + j] = BigInt(id)), (mask[i * L + j] = 1n))));
  const feeds = {
    input_ids: new ort.Tensor("int64", ids, [B, L]),
    attention_mask: new ort.Tensor("int64", mask, [B, L]),
    token_type_ids: new ort.Tensor("int64", new BigInt64Array(B * L), [B, L]),
  };
  const out = (await session.run(feeds)).last_hidden_state;
  const H = out.dims[2];
  const data = out.data;
  return encs.map((e, i) => {
    const v = new Float32Array(H);
    const n0 = pooling === "cls" ? 1 : e.length;
    for (let j = 0; j < n0; j++) for (let h = 0; h < H; h++) v[h] += data[(i * L + j) * H + h];
    let n = 0;
    for (let h = 0; h < H; h++) n += v[h] * v[h];
    n = Math.sqrt(n) || 1;
    for (let h = 0; h < H; h++) v[h] /= n;
    return v;
  });
}
