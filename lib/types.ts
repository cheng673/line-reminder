export type ReminderStatus = "pending" | "processing" | "sent" | "failed";

export type Reminder = {
  id: string;
  message: string;
  scheduledAt: string;
  lineUserId: string;
  recipientName: string;
  status: ReminderStatus;
};

export type Recipient = {
  lineUserId: string;
  displayName: string;
};
