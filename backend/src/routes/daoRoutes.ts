import express from 'express';
import daoController from '../controllers/daoController';

const router = express.Router();

// Proposal routes
router.get('/proposals', daoController.getProposals);
router.get('/proposals/:id', daoController.getProposal);
router.post('/proposals', daoController.createProposal);
router.patch('/proposals/:id/status', daoController.updateProposalStatus);

// Voting routes
router.post('/vote', daoController.voteOnProposal);

export default router;
