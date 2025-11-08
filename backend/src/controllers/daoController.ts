import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_VOTES_PER_WALLET = 2;

// Get all active proposals
const getProposals = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const proposals = await prisma.daoProposal.findMany({
      where,
      include: {
        votes: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

// Create new proposal
const createProposal = async (req: Request, res: Response) => {
  try {
    const { title, description, proposerWallet, expiresAt } = req.body;

    if (!title || !description || !proposerWallet || !expiresAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const proposal = await prisma.daoProposal.create({
      data: {
        title,
        description,
        proposer_wallet: proposerWallet,
        expires_at: new Date(expiresAt),
      },
    });

    res.json({ success: true, proposal });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
};

// Vote on proposal
const voteOnProposal = async (req: Request, res: Response) => {
  try {
    const { proposalId, voterWallet, voteType } = req.body;

    if (!proposalId || !voterWallet || !voteType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if proposal exists and is active
    const proposal = await prisma.daoProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Proposal is not active' });
    }

    if (new Date() > proposal.expires_at) {
      return res.status(400).json({ error: 'Proposal has expired' });
    }

    // Check existing votes from this wallet
    const existingVote = await prisma.daoVote.findUnique({
      where: {
        proposal_id_voter_wallet: {
          proposal_id: proposalId,
          voter_wallet: voterWallet,
        },
      },
    });

    if (existingVote) {
      // Check if wallet has reached max votes
      if (existingVote.vote_count >= MAX_VOTES_PER_WALLET) {
        return res.status(400).json({ error: 'Maximum votes per wallet reached' });
      }

      // Update existing vote
      const updatedVote = await prisma.daoVote.update({
        where: {
          proposal_id_voter_wallet: {
            proposal_id: proposalId,
            voter_wallet: voterWallet,
          },
        },
        data: {
          vote_count: { increment: 1 },
        },
      });

      // Update proposal vote counts
      await prisma.daoProposal.update({
        where: { id: proposalId },
        data: {
          votes_for: voteType === 'APPROVE' ? { increment: 1 } : undefined,
          votes_against: voteType === 'REJECT' ? { increment: 1 } : undefined,
        },
      });

      res.json({ success: true, vote: updatedVote });
    } else {
      // Create new vote
      const vote = await prisma.daoVote.create({
        data: {
          proposal_id: proposalId,
          voter_wallet: voterWallet,
          vote_type: voteType,
          vote_count: 1,
        },
      });

      // Update proposal vote counts
      await prisma.daoProposal.update({
        where: { id: proposalId },
        data: {
          votes_for: voteType === 'APPROVE' ? { increment: 1 } : undefined,
          votes_against: voteType === 'REJECT' ? { increment: 1 } : undefined,
        },
      });

      res.json({ success: true, vote });
    }
  } catch (error) {
    console.error('Error voting on proposal:', error);
    res.status(500).json({ error: 'Failed to vote on proposal' });
  }
};

// Get proposal by ID
const getProposal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proposal = await prisma.daoProposal.findUnique({
      where: { id },
      include: {
        votes: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
};

// Update proposal status (admin only)
const updateProposalStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const proposal = await prisma.daoProposal.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, proposal });
  } catch (error) {
    console.error('Error updating proposal status:', error);
    res.status(500).json({ error: 'Failed to update proposal status' });
  }
};

export default {
  getProposals,
  createProposal,
  voteOnProposal,
  getProposal,
  updateProposalStatus,
};
