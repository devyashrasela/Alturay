const router = require('express').Router({ mergeParams: true });
const rateLimit = require('express-rate-limit');
const memberController = require('../controllers/memberController');
const validate = require('../middlewares/validate');
const { requirePermission } = require('../middlewares/requirePermission');
const { addMemberSchema, updateMemberRoleSchema } = require('../validators/memberValidator');

const addMemberLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many member invite attempts. Please try again later.',
    },
  },
});

router.get('/', requirePermission('member.view'), memberController.list);
router.post('/', requirePermission('member.add'), addMemberLimiter, validate(addMemberSchema), memberController.add);
router.delete('/me', memberController.leave);
router.patch('/:memberId', requirePermission('member.update_role'), validate(updateMemberRoleSchema), memberController.updateRole);
router.delete('/:memberId', requirePermission('member.remove'), memberController.remove);

module.exports = router;
