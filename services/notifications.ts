// services/notifications.ts — Real-time notification service with WhatsApp integration

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  emergencyOnly: boolean;
}

export interface MedicationNotification {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  time: string;
  frequency: string;
  type: 'reminder' | 'missed' | 'emergency' | 'safety_warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: Date;
  userId: string;
}

export interface WhatsAppConfig {
  phoneNumber: string; // Nigerian format: +234XXXXXXXXXX
  apiKey?: string;
  businessAccountId?: string;
  accessToken?: string;
}

export class NotificationService {
  private notifications: MedicationNotification[] = [];
  private settings: NotificationSettings;
  private whatsappConfig: WhatsAppConfig | null = null;
  private serviceWorker: ServiceWorker | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.initializeServiceWorker();
    this.setupPeriodicChecks();
  }

  // Initialize service worker for background notifications
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration.active;
        
        // Request notification permission
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Create immediate notification when medication is added
  public async createMedicationReminder(medication: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    startDate: Date;
    endDate?: Date;
    isPregnancySafe?: boolean;
    category?: string;
  }) {
    const notification: MedicationNotification = {
      id: `med-${medication.id}-${Date.now()}`,
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      frequency: medication.frequency,
      type: 'reminder',
      priority: medication.isPregnancySafe === false ? 'high' : 'medium',
      message: this.generateReminderMessage(medication),
      createdAt: new Date(),
      userId: 'current-user' // Replace with actual user ID
    };

    // Add to notification queue
    this.notifications.push(notification);

    // Send immediate notification
    await this.sendNotification(notification);

    // Schedule recurring notifications
    this.scheduleRecurringNotifications(medication);

    return notification;
  }

  // Generate contextual reminder messages
  private generateReminderMessage(medication: any): string {
    const messages = [
      `Time to take your ${medication.name} (${medication.dosage})`,
      `Medication reminder: ${medication.name} - ${medication.dosage}`,
      `Don't forget to take ${medication.name}`,
      `Your ${medication.name} dose is ready`
    ];

    // Add pregnancy-specific messages
    if (medication.isPregnancySafe === false) {
      return `⚠️ IMPORTANT: Consult your doctor before taking ${medication.name}. This medication may not be safe during pregnancy.`;
    }

    if (medication.isPregnancySafe && medication.category) {
      return `✅ Safe during pregnancy: Time for your ${medication.name} (${medication.dosage})`;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Schedule recurring notifications
  private scheduleRecurringNotifications(medication: any) {
    medication.times.forEach((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduleTime = new Date();
      scheduleTime.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (scheduleTime <= now) {
        scheduleTime.setDate(scheduleTime.getDate() + 1);
      }

      const delay = scheduleTime.getTime() - now.getTime();

      setTimeout(() => {
        this.createTimedReminder(medication, time);
        
        // Set up daily recurring notifications
        const interval = setInterval(() => {
          this.createTimedReminder(medication, time);
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Clear interval when medication period ends
        if (medication.endDate) {
          const endTime = medication.endDate.getTime() - new Date().getTime();
          setTimeout(() => clearInterval(interval), endTime);
        }
      }, delay);
    });
  }

  // Create timed medication reminder
  private async createTimedReminder(medication: any, time: string) {
    const notification: MedicationNotification = {
      id: `timed-${medication.id}-${time}-${Date.now()}`,
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      time,
      frequency: medication.frequency,
      type: 'reminder',
      priority: 'medium',
      message: `Time to take your ${medication.name} (${medication.dosage})`,
      createdAt: new Date(),
      userId: 'current-user'
    };

    await this.sendNotification(notification);
  }

  // Send notification through multiple channels
  private async sendNotification(notification: MedicationNotification) {
    if (!this.settings.enabled) return;

    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification(`Olive AI - ${notification.type === 'reminder' ? 'Medication' : 'Safety'} Alert`, {
        body: notification.message,
        icon: '/manifest.json',
        badge: '/manifest.json',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
        silent: !this.settings.sound
      });
    }

    // Vibration for mobile
    if (this.settings.vibration && 'vibrate' in navigator) {
      const pattern = notification.priority === 'critical' ? [200, 100, 200] : [100];
      navigator.vibrate(pattern);
    }

    // WhatsApp notification (if configured)
    if (this.settings.whatsapp && this.whatsappConfig) {
      await this.sendWhatsAppNotification(notification);
    }

    // Add to browser storage for persistence
    this.saveNotification(notification);
  }

  // WhatsApp Business API integration
  private async sendWhatsAppNotification(notification: MedicationNotification) {
    if (!this.whatsappConfig?.phoneNumber) {
      console.warn('WhatsApp phone number not configured');
      return;
    }

    try {
      // Using WhatsApp Business API (requires business account)
      const message = this.formatWhatsAppMessage(notification);
      
      // For development/demo purposes, we'll use a simple HTTP request
      // In production, you would use WhatsApp Business API or a service like Twilio
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.whatsappConfig.phoneNumber,
          message: message,
          notificationId: notification.id
        })
      });

      if (response.ok) {
        console.log('WhatsApp notification sent successfully');
      } else {
        console.error('Failed to send WhatsApp notification:', response.statusText);
      }
    } catch (error) {
      console.error('WhatsApp notification error:', error);
    }
  }

  // Format message for WhatsApp with Nigerian context
  private formatWhatsAppMessage(notification: MedicationNotification): string {
    const emoji = notification.type === 'emergency' ? '🚨' : 
                  notification.type === 'safety_warning' ? '⚠️' : '💊';
    
    let message = `${emoji} *Olive AI Health Alert*\n\n`;
    
    if (notification.type === 'reminder') {
      message += `Time for your medication:\n`;
      message += `*${notification.medicationName}* - ${notification.dosage}\n`;
      message += `Scheduled: ${notification.time}\n\n`;
      message += `Stay healthy! 💚\n`;
      message += `Reply STOP to opt out`;
    } else if (notification.type === 'safety_warning') {
      message += `*IMPORTANT SAFETY ALERT*\n\n`;
      message += `Medication: *${notification.medicationName}*\n`;
      message += `Warning: ${notification.message}\n\n`;
      message += `Please consult your doctor immediately if you have concerns.\n`;
      message += `For emergencies, call 199 or visit your nearest hospital.`;
    }

    return message;
  }

  // Configure WhatsApp settings
  public configureWhatsApp(config: WhatsAppConfig) {
    // Validate Nigerian phone number format
    const nigerianPhoneRegex = /^\+234[7-9][0-1]\d{8}$/;
    if (!nigerianPhoneRegex.test(config.phoneNumber)) {
      throw new Error('Please enter a valid Nigerian phone number (+234XXXXXXXXXX)');
    }

    this.whatsappConfig = config;
    this.saveSettings();
  }

  // Update notification settings
  public updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Get pending notifications
  public getPendingNotifications(): MedicationNotification[] {
    return this.notifications.filter(n => 
      new Date().getTime() - n.createdAt.getTime() < 24 * 60 * 60 * 1000
    );
  }

  // Mark notification as read
  public markAsRead(notificationId: string) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.saveNotification(null, notificationId);
    }
  }

  // Emergency notification for drug interactions or safety issues
  public async sendEmergencyAlert(medication: string, warning: string) {
    const emergency: MedicationNotification = {
      id: `emergency-${Date.now()}`,
      medicationId: '',
      medicationName: medication,
      dosage: '',
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      frequency: '',
      type: 'emergency',
      priority: 'critical',
      message: warning,
      createdAt: new Date(),
      userId: 'current-user'
    };

    await this.sendNotification(emergency);
    
    // Also send immediate WhatsApp alert for emergencies
    if (this.whatsappConfig) {
      await this.sendWhatsAppNotification(emergency);
    }
  }

  // Set up periodic checks for missed medications
  private setupPeriodicChecks() {
    setInterval(() => {
      this.checkMissedMedications();
    }, 15 * 60 * 1000); // Check every 15 minutes
  }

  private checkMissedMedications() {
    // Implementation for checking missed medication times
    // This would integrate with the medication schedule
  }

  // Save notification to localStorage
  private saveNotification(notification: MedicationNotification | null, removeId?: string) {
    try {
      let saved = JSON.parse(localStorage.getItem('olive_notifications') || '[]');
      
      if (removeId) {
        saved = saved.filter((n: any) => n.id !== removeId);
      } else if (notification) {
        saved.push(notification);
        // Keep only last 100 notifications
        if (saved.length > 100) {
          saved = saved.slice(-100);
        }
      }
      
      localStorage.setItem('olive_notifications', JSON.stringify(saved));
    } catch (error) {
      console.error('Failed to save notification:', error);
    }
  }

  // Load settings from localStorage
  private loadSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem('olive_notification_settings');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        sound: true,
        vibration: true,
        whatsapp: false,
        email: false,
        sms: false,
        emergencyOnly: false
      };
    } catch {
      return {
        enabled: true,
        sound: true,
        vibration: true,
        whatsapp: false,
        email: false,
        sms: false,
        emergencyOnly: false
      };
    }
  }

  // Save settings to localStorage
  private saveSettings() {
    try {
      localStorage.setItem('olive_notification_settings', JSON.stringify(this.settings));
      if (this.whatsappConfig) {
        localStorage.setItem('olive_whatsapp_config', JSON.stringify(this.whatsappConfig));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}

// Create global notification service instance
export const notificationService = new NotificationService();