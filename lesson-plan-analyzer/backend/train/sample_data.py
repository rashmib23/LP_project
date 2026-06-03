"""
Synthetic training corpus generator.

Each row is (text, bloom_label, strategy_label).
Real deployments should replace this with a labeled lesson-plan corpus —
this generator gives the model enough signal to learn the correct
verb / cue patterns and ship a working prototype.
"""
import random
from typing import List, Tuple

random.seed(42)

BLOOM_TEMPLATES = {
    "Remember": [
        "Students will list the {n} main {topic}.",
        "Define the term {topic} and identify its key components.",
        "Recall the definition of {topic} and state two examples.",
        "Name the {n} steps in the {topic} process.",
        "Memorize the formula for {topic} and reproduce it on the board.",
        "Match each {topic} term with its correct definition.",
    ],
    "Understand": [
        "Explain the concept of {topic} in your own words.",
        "Summarize the main ideas behind {topic} after the lecture.",
        "Compare and contrast {topic} with a related concept and report the differences.",
        "Interpret the diagram of {topic} and discuss what each part represents.",
        "Paraphrase the working principle of {topic} for a non-technical audience.",
        "Predict what would happen if a parameter of {topic} were changed.",
    ],
    "Apply": [
        "Apply the {topic} method to solve the given numerical problem.",
        "Use {topic} to compute the result for the given dataset.",
        "Demonstrate how to implement {topic} on a real-world example.",
        "Solve the practice problems involving {topic} using the appropriate formula.",
        "Construct a working example that uses {topic} to achieve a target output.",
        "Calculate the {topic} value for the supplied parameters.",
    ],
    "Analyze": [
        "Analyze the performance of {topic} under varying conditions and identify patterns.",
        "Differentiate between two implementations of {topic} and examine their trade-offs.",
        "Investigate the failure modes of {topic} and categorize them by root cause.",
        "Distinguish between cause and effect when {topic} is applied incorrectly.",
        "Examine the dataset to determine which features most influence {topic}.",
        "Deconstruct the algorithm for {topic} into its component steps and discuss each.",
    ],
    "Evaluate": [
        "Evaluate the effectiveness of {topic} compared with an alternative approach.",
        "Critique the design of {topic} and justify whether it meets the requirements.",
        "Assess the validity of the conclusions drawn from {topic} experiments.",
        "Defend a chosen solution for {topic} and argue for its correctness.",
        "Judge the quality of two reports on {topic} using the provided rubric.",
        "Test the proposed {topic} solution and validate its accuracy.",
    ],
    "Create": [
        "Design a new system that uses {topic} to solve a real-world problem.",
        "Develop a small project that integrates {topic} with another component.",
        "Create a prototype demonstrating {topic} in an unfamiliar context.",
        "Compose a research proposal exploring an extension of {topic}.",
        "Formulate a novel algorithm based on {topic} and explain its advantages.",
        "Build and present a working model that applies {topic} end-to-end.",
    ],
}

STRATEGY_TEMPLATES = {
    "Lecture-based": [
        "The instructor will deliver a lecture using slides on {topic}, "
        "explaining the core ideas with the whiteboard and giving notes for review.",
        "Begin with a 30-minute presentation that introduces {topic}; "
        "students take notes while the lecturer explains each slide.",
        "A traditional verbal instruction session covering {topic}, supported "
        "by slides and a printed handout.",
    ],
    "Inquiry-based": [
        "Students investigate {topic} by formulating their own questions, "
        "exploring resources, and testing a hypothesis they propose.",
        "Pose an open-ended question about {topic} and let teams research and "
        "discover the answer using guided inquiry.",
        "An inquiry-based session where learners ask questions about {topic}, "
        "investigate findings, and discuss conclusions.",
    ],
    "Activity-based": [
        "A hands-on activity in which students complete a worksheet on {topic} "
        "and practice the steps individually.",
        "Run an in-class exercise on {topic} with a simulation and a role-play "
        "to reinforce the concept through practice.",
        "Distribute task sheets on {topic}; students work through hands-on "
        "drills and a short experiment.",
    ],
    "Project-based": [
        "Students will build a small project on {topic} as a team, with weekly "
        "milestones and a final prototype deliverable.",
        "A long-term project where each group designs and develops a system "
        "around {topic}, presenting a case study at the end.",
        "Project-based learning: design, build, and demonstrate a working "
        "prototype that applies {topic}.",
    ],
    "Discussion-based": [
        "Lead a class discussion on {topic} using think-pair-share and a "
        "structured debate to surface different viewpoints.",
        "A seminar-style discussion where students brainstorm ideas about "
        "{topic} and dialogue with the instructor.",
        "Facilitate a group discussion and debate on {topic}, ending with a "
        "synthesis of the key points.",
    ],
    "Demonstration-based": [
        "The instructor will demonstrate {topic} on a live system and walk "
        "through each step while students observe.",
        "A demonstration session showing how {topic} works through a live "
        "example and a tutorial walkthrough.",
        "Model the correct procedure for {topic} with a live demonstration; "
        "students watch and take notes.",
    ],
}

TOPICS = [
    "Newton's laws", "photosynthesis", "binary search", "linked lists",
    "the water cycle", "supply and demand", "thermodynamics",
    "pythagoras theorem", "object oriented programming", "DNA replication",
    "Ohm's law", "the French Revolution", "matrix multiplication",
    "neural networks", "the OSI model", "gravitational fields",
    "the periodic table", "operating system scheduling",
    "Bayes theorem", "stack data structure", "TCP/IP protocols",
    "linear regression", "algorithmic complexity", "mitosis",
]


def generate_corpus(samples_per_label: int = 80) -> List[Tuple[str, str, str]]:
    """
    Cross-product samples: one Bloom template + one Strategy template form a row.
    Each row therefore has BOTH a bloom label and a strategy label, but the two
    classifiers are trained independently on the same documents.
    """
    rows = []
    bloom_keys = list(BLOOM_TEMPLATES.keys())
    strat_keys = list(STRATEGY_TEMPLATES.keys())

    target_total = samples_per_label * len(bloom_keys)
    for _ in range(target_total):
        b = random.choice(bloom_keys)
        s = random.choice(strat_keys)
        topic = random.choice(TOPICS)
        n = random.choice(["three", "four", "five", "six"])
        bloom_sentence = random.choice(BLOOM_TEMPLATES[b]).format(topic=topic, n=n)
        strat_sentence = random.choice(STRATEGY_TEMPLATES[s]).format(topic=topic)
        # Combine into a tiny "lesson plan paragraph"
        text = (
            f"Topic: {topic}.\n"
            f"Learning objective: {bloom_sentence}\n"
            f"Teaching method: {strat_sentence}\n"
            f"Assessment: Students will be assessed via questions on {topic}."
        )
        rows.append((text, b, s))
    return rows


if __name__ == "__main__":
    rows = generate_corpus(60)
    print(f"Generated {len(rows)} samples")
    print("---")
    print(rows[0][0])
    print("Bloom:", rows[0][1], "| Strategy:", rows[0][2])
