const cursorPagination = (options = {}) => {
  const maxLimit = options.maxLimit || 100;
  const defaultLimit = options.defaultLimit || 50;

  return (req, res, next) => {
    const cursor = req.query.cursor || null;
    let limit = parseInt(req.query.limit, 10) || defaultLimit;
    if (limit < 1) limit = 1;
    if (limit > maxLimit) limit = maxLimit;

    req.pagination = { cursor, limit };
    next();
  };
};

const encodeCursor = (lastValue, id) => {
  if (lastValue === undefined || lastValue === null) return null;
  return Buffer.from(JSON.stringify({ v: lastValue, id })).toString("base64url");
};

const decodeCursor = (cursor) => {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const buildPaginatedResponse = (data, limit, encodeFn) => {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    nextCursor = typeof encodeFn === "function"
      ? encodeFn(last)
      : encodeCursor(last.created_at || last.id, last.id);
  }
  return { items, nextCursor, hasMore };
};

module.exports = { cursorPagination, encodeCursor, decodeCursor, buildPaginatedResponse };
