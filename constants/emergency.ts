// constants/emergency.ts — Nigerian emergency contacts and trigger data
import type { EmergencyContact, EmergencyDetection } from "@/types";

/** Nigerian emergency telephone numbers */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
    {
        name: "Nigeria National Emergency",
        number: "112",
        description: "National emergency line — police, fire, ambulance",
        area: "Nationwide",
    },
    {
        name: "Lagos LASEMA (Emergency)",
        number: "767",
        description: "Lagos State Emergency Management Agency",
        area: "Lagos State",
    },
    {
        name: "Lagos Island General Hospital",
        number: "+234-1-460-0000",
        description: "Major public hospital — Lagos Island",
        area: "Lagos",
    },
    {
        name: "National Hospital Abuja",
        number: "+234-9-523-0847",
        description: "Federal capital territory main hospital",
        area: "Abuja",
    },
    {
        name: "Nigerian Red Cross",
        number: "0800-733-2767",
        description: "Red Cross emergency and disaster support",
        area: "Nationwide",
    },
    {
        name: "Suicide / Mental Health Crisis Line",
        number: "0800-789-1234",
        description: "Mental health crisis support — confidential",
        area: "Nationwide",
    },
    {
        name: "NSCDC (Civil Defence)",
        number: "0800-222-2255",
        description: "Nigeria Security and Civil Defence Corps",
        area: "Nationwide",
    },
    {
        name: "Poison Control Nigeria",
        number: "+234-803-399-9370",
        description: "National Poison Information Centre — University of Jos",
        area: "Nationwide",
    },
];

/** Keywords that trigger emergency detection — grouped by condition */
export const EMERGENCY_TRIGGERS: {
    condition: string;
    keywords: string[];
    instruction_en: string;
    instruction_pidgin: string;
    severity: "critical" | "high" | "moderate";
}[] = [
        {
            condition: "Severe vaginal bleeding",
            keywords: [
                "heavy bleeding",
                "blood everywhere",
                "haemorrhage",
                "hemorrhage",
                "bleeding heavily",
                "so much blood",
                "blood dey flow",
                "blood no stop",
                "bleeding wont stop",
            ],
            instruction_en:
                "Lie down immediately. Do NOT stand or walk. Put a pad or clean cloth between your legs. Call 112 or go to the nearest hospital NOW. This could be a medical emergency.",
            instruction_pidgin:
                "Lie down one time. No stand, no waka. Put pad or clean cloth for your leg middle. Call 112 or go nearest hospital NOW. This thing serious o.",
            severity: "critical",
        },
        {
            condition: "Eclampsia warning signs",
            keywords: [
                "severe headache",
                "blurred vision",
                "seeing spots",
                "swollen face",
                "headache and blurred",
                "bad headache",
                "my head dey pain",
                "eye dey blur",
                "i dey see double",
                "headache blurred vision",
                "eclampsia",
                "preeclampsia",
            ],
            instruction_en:
                "This could be eclampsia — a life-threatening condition. Lie on your LEFT side. Do not eat or drink anything. Someone must take you to the hospital IMMEDIATELY. Call 112.",
            instruction_pidgin:
                "This one fit be eclampsia — e dey very dangerous. Lie down for your LEFT side. No chop, no drink anything. Make somebody carry you go hospital NOW NOW. Call 112.",
            severity: "critical",
        },
        {
            condition: "Reduced fetal movement",
            keywords: [
                "baby not moving",
                "no baby movement",
                "baby stopped moving",
                "cant feel baby",
                "pikin no dey move",
                "baby no move",
                "reduced fetal movement",
                "no fetal movement",
                "baby quiet",
                "baby no dey kick",
            ],
            instruction_en:
                "Drink a cold glass of water, lie on your left side for 2 hours, and count movements. If you feel fewer than 10 movements in 2 hours, go to the hospital IMMEDIATELY. Call your doctor NOW.",
            instruction_pidgin:
                "Drink cold water, lie down for your left side for 2 hours, count as baby dey move. If baby no move up to 10 times for 2 hours, rush go hospital. Call your doctor NOW.",
            severity: "critical",
        },
        {
            condition: "Chest pain / breathing difficulty",
            keywords: [
                "chest pain",
                "cant breathe",
                "shortness of breath",
                "difficulty breathing",
                "heart pain",
                "chest dey pain",
                "i no fit breathe",
                "breathing problem",
            ],
            instruction_en:
                "Sit upright. Do not lie flat. Loosen any tight clothing. If you have aspirin and are not allergic, chew one. Call 112 immediately or have someone drive you to the nearest hospital.",
            instruction_pidgin:
                "Sit up straight. No lie down flat. Loose any tight cloth. If you get aspirin and you no dey allergic, chew one. Call 112 now now or make person carry you go hospital.",
            severity: "critical",
        },
        {
            condition: "Convulsions / seizures",
            keywords: [
                "convulsion",
                "seizure",
                "fits",
                "shaking",
                "body dey shake",
                "falling down shaking",
                "epilepsy attack",
                "having a fit",
                "convulsing",
            ],
            instruction_en:
                "Clear the area around the person. Turn them on their side. Do NOT put anything in their mouth. Time the seizure. Call 112 immediately. If seizure lasts more than 5 minutes, this is critical.",
            instruction_pidgin:
                "Clear everywhere around the person. Turn am for side. No put anything for mouth. Count how long the shaking dey last. Call 112 now now. If e pass 5 minutes, e don serious pass.",
            severity: "critical",
        },
        {
            condition: "Drug overdose",
            keywords: [
                "overdose",
                "took too many",
                "swallowed too much",
                "too many pills",
                "i take too much",
                "i drink too much medicine",
                "accidentally took extra",
                "double dose",
                "drug overdose",
            ],
            instruction_en:
                "Call Poison Control: +234-803-399-9370 or go to the nearest hospital. If possible, bring the medicine container with you. Do NOT try to vomit unless a doctor says so.",
            instruction_pidgin:
                "Call Poison Control: +234-803-399-9370 or rush go hospital. If you fit, carry the medicine container go with you. No try to vomit unless doctor talk say make you do am.",
            severity: "critical",
        },
        {
            condition: "Suicidal ideation / self-harm",
            keywords: [
                "want to die",
                "kill myself",
                "end my life",
                "no reason to live",
                "better off dead",
                "i wan die",
                "no hope",
                "life no worth",
                "suicide",
                "self harm",
                "hurt myself",
                "self-harm",
                "cutting myself",
            ],
            instruction_en:
                "You are not alone, and help is available right now. Please call the Mental Health Crisis Line: 0800-789-1234. You can also text or WhatsApp. Your life matters. Please reach out to someone you trust.",
            instruction_pidgin:
                "You no dey alone, help dey available right now. Abeg call Mental Health Crisis Line: 0800-789-1234. You fit text or WhatsApp too. Your life important. Abeg talk to somebody wey you trust.",
            severity: "critical",
        },
        {
            condition: "High fever with pregnancy",
            keywords: [
                "high fever",
                "very hot",
                "temperature high",
                "burning up",
                "fever and pregnant",
                "body dey hot",
                "i dey hot well well",
                "malaria and pregnant",
            ],
            instruction_en:
                "A high fever during pregnancy can be dangerous. Take paracetamol (NOT ibuprofen) to reduce the fever. Sponge with lukewarm water. See a doctor as soon as possible — within hours, not days.",
            instruction_pidgin:
                "High fever when you dey pregnant fit dangerous. Take paracetamol (NO be ibuprofen). Use lukewarm water sponge your body. See doctor as fast as you fit — today today, no wait till tomorrow.",
            severity: "high",
        },
    ];

/**
 * Check a text message for emergency keywords and return detection result.
 * Scans the message against all known emergency trigger patterns.
 */
export function detectEmergency(message: string): EmergencyDetection | null {
    const lowerMessage = message.toLowerCase();

    for (const trigger of EMERGENCY_TRIGGERS) {
        const matchedKeywords = trigger.keywords.filter((keyword) =>
            lowerMessage.includes(keyword.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
            return {
                isEmergency: true,
                severity: trigger.severity,
                condition: trigger.condition,
                instruction: trigger.instruction_en,
                pidginInstruction: trigger.instruction_pidgin,
                triggerKeywords: matchedKeywords,
            };
        }
    }

    return null;
}
