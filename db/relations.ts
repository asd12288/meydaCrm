import { relations } from 'drizzle-orm';
import {
  profiles,
  leads,
  leadComments,
  leadHistory,
  importJobs,
  importRows,
  notes,
  meetings,
} from './schema';

export const profilesRelations = relations(profiles, ({ many }) => ({
  assignedLeads: many(leads),
  comments: many(leadComments),
  historyEvents: many(leadHistory),
  importJobs: many(importJobs),
  notes: many(notes),
  assignedMeetings: many(meetings, { relationName: 'meetingAssignee' }),
  createdMeetings: many(meetings, { relationName: 'meetingCreator' }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignee: one(profiles, {
    fields: [leads.assignedTo],
    references: [profiles.id],
  }),
  comments: many(leadComments),
  history: many(leadHistory),
  notes: many(notes),
  meetings: many(meetings),
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

export const notesRelations = relations(notes, ({ one }) => ({
  creator: one(profiles, {
    fields: [notes.createdBy],
    references: [profiles.id],
  }),
  lead: one(leads, {
    fields: [notes.leadId],
    references: [leads.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  lead: one(leads, {
    fields: [meetings.leadId],
    references: [leads.id],
  }),
  assignee: one(profiles, {
    fields: [meetings.assignedTo],
    references: [profiles.id],
    relationName: 'meetingAssignee',
  }),
  creator: one(profiles, {
    fields: [meetings.createdBy],
    references: [profiles.id],
    relationName: 'meetingCreator',
  }),
}));
