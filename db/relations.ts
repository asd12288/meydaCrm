import { relations } from 'drizzle-orm';
import {
  profiles,
  leads,
  leadComments,
  leadHistory,
  importJobs,
  importRows,
} from './schema';

export const profilesRelations = relations(profiles, ({ many }) => ({
  assignedLeads: many(leads),
  comments: many(leadComments),
  historyEvents: many(leadHistory),
  importJobs: many(importJobs),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignee: one(profiles, {
    fields: [leads.assignedTo],
    references: [profiles.id],
  }),
  comments: many(leadComments),
  history: many(leadHistory),
}));

export const leadCommentsRelations = relations(leadComments, ({ one }) => ({
  lead: one(leads, {
    fields: [leadComments.leadId],
    references: [leads.id],
  }),
  author: one(profiles, {
    fields: [leadComments.authorId],
    references: [profiles.id],
  }),
}));

export const leadHistoryRelations = relations(leadHistory, ({ one }) => ({
  lead: one(leads, {
    fields: [leadHistory.leadId],
    references: [leads.id],
  }),
  actor: one(profiles, {
    fields: [leadHistory.actorId],
    references: [profiles.id],
  }),
}));

export const importJobsRelations = relations(importJobs, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [importJobs.createdBy],
    references: [profiles.id],
  }),
  rows: many(importRows),
}));

export const importRowsRelations = relations(importRows, ({ one }) => ({
  job: one(importJobs, {
    fields: [importRows.importJobId],
    references: [importJobs.id],
  }),
}));
