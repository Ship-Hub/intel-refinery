import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CircleAlert,
  FileText,
  Headphones,
  Image as ImageIcon,
  MessageSquareWarning,
  Scale,
  ShieldCheck,
  UsersRound
} from "lucide-react";

const USE_CASE_ROTATION_MS = 5000;

const useCases = [
  {
    title: "Group moderation",
    description:
      "See when a chat is getting heated, which messages caused it, and what needs a moderator's attention first.",
    icon: ShieldCheck,
    visual: "moderation"
  },
  {
    title: "Web3 and crypto groups",
    description:
      "Track FUD, soft FUD, soft shilling, rumor loops, and fast narrative shifts before the group reacts without context.",
    icon: CircleAlert,
    visual: "crypto"
  },
  {
    title: "Buyer and seller disputes",
    description:
      "Put messages, receipts, screenshots, and order history in one place so the case is easier to review.",
    icon: FileText,
    visual: "marketplace"
  },
  {
    title: "Customer support review",
    description:
      "Check whether staff are polite, helpful, following policy, and actually solving customer problems.",
    icon: Headphones,
    visual: "support"
  },
  {
    title: "Moderator reports",
    description:
      "Create daily, weekly, monthly, or on-demand Telegram admin reports and see which display names are helpful, hostile, reckless, or missing work.",
    icon: UsersRound,
    visual: "reports"
  },
  {
    title: "Escrow platform arbitration",
    description:
      "Package buyer, seller, escrow notes, screenshots, and message history into a clearer arbitration file before a ruling.",
    icon: Scale,
    visual: "escrow"
  },
  {
    title: "X and Twitter threads",
    description:
      "Read long threads faster, pull out the main points, and see where the tone changes or context is missing.",
    icon: MessageSquareWarning,
    visual: "social"
  },
  {
    title: "Image and audio review",
    description:
      "Read screenshots, pull text from images, and turn voice notes into text that can be reviewed with the rest of the case.",
    icon: ImageIcon,
    visual: "media"
  }
];

export default function UseCases() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotationSeed, setRotationSeed] = useState(0);
  const activeUseCase = useCases[activeIndex];
  const ActiveIcon = activeUseCase.icon;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % useCases.length);
    }, USE_CASE_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [rotationSeed]);

  const selectUseCase = (index) => {
    setActiveIndex(index);
    setRotationSeed((currentSeed) => currentSeed + 1);
  };

  return (
    <section
      id="use-cases"
      className="section-shell"
    >
      <div className="max-w-3xl">
        <p className="section-kicker">Use Cases</p>
        <h2 className="mt-3 font-display text-3xl uppercase text-white sm:text-4xl">
          What Intel Refinery Helps You See
        </h2>
        <p className="mt-4 font-body text-xl leading-8 text-chrome">
          Practical tools for real conversations, evidence, and team review.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-2">
          {useCases.map((useCase, index) => (
            <button
              key={useCase.title}
              type="button"
              aria-pressed={index === activeIndex}
              className={`use-case-tab ${index === activeIndex ? "is-active" : ""}`}
              onClick={() => selectUseCase(index)}
              style={{ "--use-case-duration": `${USE_CASE_ROTATION_MS}ms` }}
            >
              <useCase.icon className="h-4 w-4" />
              <span>{useCase.title}</span>
            </button>
          ))}
        </div>

        <div className="use-case-workbench" aria-live="polite">
          <div
            key={activeUseCase.title}
            className="use-case-detail-grid grid gap-5 xl:grid-cols-[0.72fr_1.28fr]"
            style={{ "--use-case-duration": `${USE_CASE_ROTATION_MS}ms` }}
          >
            <div className="use-case-copy">
              <div className="use-case-badge">
                <ActiveIcon className="h-4 w-4" />
                Example
              </div>
              <h3 className="mt-5 font-display text-2xl uppercase text-white sm:text-3xl">
                {activeUseCase.title}
              </h3>
              <p className="mt-4 font-body text-xl leading-8 text-chrome">
                {activeUseCase.description}
              </p>
            </div>
            <PracticalIllustration type={activeUseCase.visual} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PracticalIllustration({ type }) {
  if (type === "moderation") {
    return (
      <IllustrationShell title="Live group chat">
        <div className="use-case-chat-board">
          <MessageBubble speaker="Nora" tone="neutral" text="Please keep replies on topic." />
          <MessageBubble speaker="Ben" tone="warning" text="You keep ignoring everyone." />
          <MessageBubble speaker="Kai" tone="danger" text="This is getting out of hand." />
        </div>
        <MiniBars
          labels={["Calm", "Tense", "Heated"]}
          values={[24, 52, 86]}
        />
      </IllustrationShell>
    );
  }

  if (type === "crypto") {
    return (
      <IllustrationShell title="Rumor watch">
        <LinePulse />
        <StatGrid
          items={[
            ["FUD spikes", "14"],
            ["Soft FUD", "Rising"],
            ["Soft shilling", "Detected"]
          ]}
        />
        <MiniBars
          labels={["FUD", "Soft FUD", "Shill", "Panic"]}
          values={[18, 34, 66, 91]}
        />
        <TagRow items={["FUD", "Soft FUD", "Soft shilling", "Narrative shift"]} />
      </IllustrationShell>
    );
  }

  if (type === "marketplace") {
    return (
      <IllustrationShell title="Dispute file">
        <EvidenceTiles />
        <Timeline />
        <div className="use-case-note">Refund request linked to chat, receipt, and delivery screenshot.</div>
      </IllustrationShell>
    );
  }

  if (type === "support") {
    return (
      <IllustrationShell title="Agent review">
        <ScoreRows
          rows={[
            ["Polite", 94],
            ["Helpful", 86],
            ["Followed policy", 91],
            ["Solved issue", 62]
          ]}
        />
        <div className="use-case-note">Strong tone. Follow-up needed on issue resolution.</div>
      </IllustrationShell>
    );
  }

  if (type === "reports") {
    return (
      <IllustrationShell title="Moderator report">
        <div className="use-case-report-header">
          <BarChart3 className="h-4 w-4" />
          Weekly staff audit
        </div>
        <ReportTable />
        <TagRow items={["Daily", "Weekly", "Monthly", "On demand"]} />
      </IllustrationShell>
    );
  }

  if (type === "escrow") {
    return (
      <IllustrationShell title="Escrow arbitration file">
        <ArbitrationLedger />
        <Timeline labels={["Buyer claim", "Seller reply", "Escrow review"]} />
        <div className="use-case-note">
          Evidence packet links chat history, payment status, delivery proof, and moderator notes.
        </div>
        <TagRow items={["Buyer", "Seller", "Escrow", "Decision ready"]} />
      </IllustrationShell>
    );
  }

  if (type === "social") {
    return (
      <IllustrationShell title="Thread review">
        <ThreadCards />
        <MiniBars labels={["Facts", "Replies", "Tone change"]} values={[82, 54, 76]} />
        <TagRow items={["Main point", "Missing context", "Tone shift"]} />
      </IllustrationShell>
    );
  }

  return (
    <IllustrationShell title="Media review">
      <MediaTiles />
      <TranscriptCard />
      <TagRow items={["Image text", "Voice note", "Evidence"]} />
    </IllustrationShell>
  );
}

function IllustrationShell({ title, children }) {
  return (
    <div className="use-case-illustration">
      <div className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-glow">
        {title}
      </div>
      {children}
    </div>
  );
}

function MessageBubble({ speaker, text, tone }) {
  return (
    <div className={`use-case-message ${tone}`}>
      <strong>{speaker}</strong>
      <span>{text}</span>
    </div>
  );
}

function MiniBars({ labels, values }) {
  return (
    <div className="use-case-mini-bars">
      {values.map((value, index) => (
        <div key={labels[index]}>
          <span style={{ height: `${value}%` }} />
          <small>{labels[index]}</small>
        </div>
      ))}
    </div>
  );
}

function LinePulse() {
  return (
    <div className="use-case-line-chart">
      <span />
    </div>
  );
}

function StatGrid({ items }) {
  return (
    <div className="use-case-stat-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function EvidenceTiles() {
  return (
    <div className="use-case-evidence-tiles">
      <span>Chat</span>
      <span>Receipt</span>
      <span>Screenshot</span>
      <span>Order log</span>
    </div>
  );
}

function Timeline({ labels = ["Order placed", "Complaint", "Review"] }) {
  return (
    <div className="use-case-timeline">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

function ArbitrationLedger() {
  return (
    <div className="use-case-report-table">
      <div>
        <strong>Buyer</strong>
        <span>Funds locked</span>
        <em>Verified</em>
      </div>
      <div>
        <strong>Seller</strong>
        <span>Delivery proof</span>
        <em>Pending</em>
      </div>
      <div>
        <strong>Escrow</strong>
        <span>Thread context</span>
        <em>78%</em>
      </div>
      <div>
        <strong>Arbiter</strong>
        <span>Recommendation</span>
        <em>Review</em>
      </div>
    </div>
  );
}

function ScoreRows({ rows }) {
  return (
    <div className="use-case-score-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <small>{label}</small>
          <span>
            <i style={{ width: `${value}%` }} />
          </span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function TagRow({ items }) {
  return (
    <div className="use-case-tag-row">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function ThreadCards() {
  return (
    <div className="use-case-thread-cards">
      <span>Main post</span>
      <span>Replies</span>
      <span>Quote post</span>
    </div>
  );
}

function MediaTiles() {
  return (
    <div className="use-case-media-tiles">
      <span>Image</span>
      <span>Text found</span>
      <span>Audio</span>
    </div>
  );
}

function TranscriptCard() {
  return (
    <div className="use-case-transcript-card">
      <div className="use-case-audio-spectrum" aria-hidden="true">
        {[24, 42, 68, 54, 88, 62, 74, 36].map((height, index) => (
          <span
            key={`${height}-${index}`}
            style={{ "--audio-height": `${height}%`, "--audio-delay": `${index * 110}ms` }}
          />
        ))}
      </div>
      <small>Voice note transcript</small>
      <p>"The package arrived damaged, and I sent the photo yesterday."</p>
    </div>
  );
}

function ReportTable() {
  return (
    <div className="use-case-report-table">
      <div>
        <strong>@AlphaMod</strong>
        <span>Kind</span>
        <em>92</em>
      </div>
      <div>
        <strong>@MoonSignal</strong>
        <span>Helpful</span>
        <em>78</em>
      </div>
      <div>
        <strong>@ThreadPilot</strong>
        <span>Hostile</span>
        <em>44</em>
      </div>
      <div>
        <strong>@NightShift</strong>
        <span>Missed replies</span>
        <em>39</em>
      </div>
    </div>
  );
}
