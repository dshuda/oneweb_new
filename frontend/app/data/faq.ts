export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    id: "1",
    question: "How can I book a service?",
    answer:
      "You can book a service directly through our website or app by selecting your required service, preferred date and time, and location. Our skilled professionals will be assigned to you shortly.",
  },
  {
    id: "2",
    question: "What areas do you currently serve?",
    answer:
      "We currently offer a wide range of services including cleaning, appliance repair, shifting, electrical and plumbing work, security services, pest control, and more. Check our services section to explore all available options.",
  },
  {
    id: "3",
    question: "Can I schedule a service for a specific time?",
    answer:
      "Yes, absolutely! You can select your preferred date and time while booking. We have flexible scheduling options to accommodate your needs.",
  },
  {
    id: "4",
    question: "How are service charges calculated?",
    answer:
      "Service charges are calculated based on the service type, duration, and complexity. All pricing is transparent with no hidden charges. You can see the exact breakdown before confirming your booking.",
  },
  {
    id: "5",
    question: "Do you offer refunds?",
    answer:
      "Yes, we do offer refunds under certain conditions. If you cancel your service 24 hours before the scheduled time, you will receive a full refund. For more details, please check our refund policy.",
  },
  {
    id: "6",
    question: "Do your professionals bring their own equipment?",
    answer:
      "Yes, our professionals bring all necessary equipment and tools for most services. However, for some specialized services, customers may need to provide certain items. This will be clearly mentioned during the booking process.",
  },
  {
    id: "7",
    question: "Are your professionals verified and trained?",
    answer:
      "Yes, all our service professionals are thoroughly vetted, trained, and verified for their expertise. We conduct background checks and quality assessments to ensure the best service quality.",
  },
];
