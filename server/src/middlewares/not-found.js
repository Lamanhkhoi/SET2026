'use strict';

// Đứng sau tất cả router: request nào tới đây = không route nào khớp.
module.exports = function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
};
