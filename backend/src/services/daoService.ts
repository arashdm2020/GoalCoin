import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const daoService = {
  /**
   * Create a new proposal
   */
  async createProposal(params: {
    title: string;
    description: string;
    proposerWallet: string;
    proposalType: string;
    payload: any;
  }) {
    try {
      const votingEndsAt = new Date();
      votingEndsAt.setDate(votingEndsAt.getDate() + 7); // 7 days voting period

      const proposal = await prisma.daoProposal.create({
        data: {
          title: params.title,
          description: params.description,
          proposer_wallet: params.proposerWallet,
          status: 'ACTIVE',
          expires_at: votingEndsAt,
        },
      });

      return proposal;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  },

  /**
   * Get all active proposals
   */
  async getActiveProposals() {
    try {
      const proposals = await prisma.daoProposal.findMany({
        where: {
          status: 'ACTIVE',
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'desc' },
      });

      return proposals;
    } catch (error) {
      console.error('Error getting proposals:', error);
      throw error;
    }
  },

  /**
   * Cast a vote
   */
  async castVote(params: {
    proposalId: string;
    voterWallet: string;
    voteType: 'APPROVE' | 'REJECT';
  }) {
    try {
      // Check if already voted
      const existingVote = await prisma.daoVote.findUnique({
        where: {
          proposal_id_voter_wallet: {
            proposal_id: params.proposalId,
            voter_wallet: params.voterWallet,
          },
        },
      });

      if (existingVote) {
        throw new Error('Already voted on this proposal');
      }

      // Create vote
      const vote = await prisma.daoVote.create({
        data: {
          proposal_id: params.proposalId,
          voter_wallet: params.voterWallet,
          vote_type: params.voteType,
          vote_count: 1, // Can be 2 for NFT holders
        },
      });

      // Update proposal vote counts
      if (params.voteType === 'APPROVE') {
        await prisma.daoProposal.update({
          where: { id: params.proposalId },
          data: { votes_for: { increment: 1 } },
        });
      } else {
        await prisma.daoProposal.update({
          where: { id: params.proposalId },
          data: { votes_against: { increment: 1 } },
        });
      }

      return vote;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  },

  /**
   * Get proposal details with votes
   */
  async getProposal(proposalId: string) {
    try {
      const proposal = await prisma.daoProposal.findUnique({
        where: { id: proposalId },
        include: {
          votes: {
            orderBy: { voted_at: 'desc' },
            take: 50,
          },
        },
      });

      return proposal;
    } catch (error) {
      console.error('Error getting proposal:', error);
      throw error;
    }
  },

  /**
   * Get user's voting history
   */
  async getUserVotes(walletAddress: string) {
    try {
      const votes = await prisma.daoVote.findMany({
        where: { voter_wallet: walletAddress },
        include: {
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
              created_at: true,
            },
          },
        },
        orderBy: { voted_at: 'desc' },
      });

      return votes;
    } catch (error) {
      console.error('Error getting user votes:', error);
      throw error;
    }
  },
};
