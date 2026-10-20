export interface Week {
  n: number;
  title: string;
  tagline: string;
  intro: string;
  concepts: string[];
  formulas: { label: string; tex: string }[];
  tips: string[];
}

export const WEEKS: Week[] = [
  {
    n: 1,
    title: 'Introduction & Types of Data',
    tagline: 'Population vs sample, variables and scales of measurement',
    intro:
      'Statistics starts with understanding *what* you are measuring. A **population** is the complete group of interest; a **sample** is the subset you actually observe. Every characteristic you record is a **variable**, and how you can summarise it depends on its type and its scale of measurement.',
    concepts: [
      '**Descriptive statistics** summarise the data you have; **inferential statistics** draw conclusions about a population from a sample.',
      '**Categorical (qualitative)** variables place an observation in a group (blood group, city). **Numerical (quantitative)** variables are counts or measurements (height, income).',
      '**Cross-sectional data** is collected at one point in time across many units; **time-series data** follows one unit over time.',
      '**Nominal** scale: labels only, no order (gender, roll numbers). **Ordinal**: ordered but gaps are not meaningful (ranks, ratings).',
      '**Interval** scale: differences are meaningful but there is no true zero (temperature in °C, years). **Ratio**: true zero, so ratios are meaningful (weight, salary).',
    ],
    formulas: [],
    tips: [
      'IDs and registration numbers are *categorical* even though they are written with digits.',
      '"Twice as hot" is meaningless on an interval scale; "twice as heavy" is fine on a ratio scale.',
      'Ranks are ordinal: rank 2 is not "twice as good" as rank 4.',
    ],
  },
  {
    n: 2,
    title: 'Describing Categorical Data',
    tagline: 'Frequency tables, bar & pie charts, mode and median',
    intro:
      'For categorical data we cannot compute an average, so we **count**. Frequency tables, bar charts and pie charts turn raw labels into a picture of how observations are spread across categories. The **mode** is always available; the **median** only makes sense when the categories are ordered.',
    concepts: [
      '**Frequency** = number of observations in a category; **relative frequency** = frequency ÷ total.',
      '**Cumulative frequency** adds frequencies up to a category (needs an order).',
      '**Bar chart**: bar height = frequency. **Pie chart**: slice angle $= 360^\\circ \\times$ relative frequency.',
      '**Pareto chart**: bars sorted in decreasing order with a cumulative line.',
      '**Mode**: most frequent category (there can be more than one). **Median**: middle category for ordinal data.',
      'Watch for misleading graphs: truncated axes, 3-D pies, unequal widths.',
    ],
    formulas: [
      { label: 'Relative frequency', tex: 'f_i^{\\text{rel}} = \\dfrac{f_i}{\\sum_j f_j}' },
      { label: 'Pie slice angle', tex: '\\theta_i = 360^\\circ \\times \\dfrac{f_i}{n}' },
    ],
    tips: [
      'Relative frequencies always add to 1 (or 100%) — use this to find a missing category.',
      'Read the axis scale on bar charts carefully before computing totals.',
    ],
  },
  {
    n: 3,
    title: 'Describing Numerical Data',
    tagline: 'Mean, median, mode, percentiles, quartiles and spread',
    intro:
      'Numerical data lets us measure the **centre** (mean, median, mode) and the **spread** (range, variance, standard deviation, IQR). Percentiles and quartiles describe position, and the five-number summary with a box plot gives a compact picture that also flags outliers.',
    concepts: [
      '**Mean** is sensitive to every value (and to outliers); **median** is robust.',
      'Adding a constant $c$ shifts mean, median, mode by $c$ but leaves range, variance and SD unchanged.',
      'Multiplying by $c$ scales mean/median by $c$, SD and range by $|c|$, variance by $c^2$.',
      '**Percentile**: the value below which a given percentage of observations fall. $Q_1, Q_2, Q_3$ are the 25th, 50th and 75th percentiles.',
      '**Five-number summary**: min, $Q_1$, median, $Q_3$, max. **IQR** $= Q_3 - Q_1$.',
      '**Outliers**: below $Q_1 - 1.5\\,\\text{IQR}$ or above $Q_3 + 1.5\\,\\text{IQR}$.',
    ],
    formulas: [
      { label: 'Mean', tex: '\\bar{x} = \\dfrac{1}{n}\\sum_{i=1}^{n} x_i' },
      { label: 'Sample variance', tex: 's^2 = \\dfrac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2' },
      { label: 'Population variance', tex: '\\sigma^2 = \\dfrac{1}{N}\\sum_{i=1}^{N}(x_i-\\mu)^2' },
      { label: 'Shortcut', tex: '\\sum (x_i-\\bar x)^2 = \\sum x_i^2 - n\\bar{x}^2' },
      { label: 'IQR', tex: '\\text{IQR} = Q_3 - Q_1' },
    ],
    tips: [
      'If a total is given ("mean of 30 values is 100"), convert to a sum first: total $= 3000$.',
      'Check whether the question wants sample ($n-1$) or population ($n$) variance.',
    ],
  },
  {
    n: 4,
    title: 'Association Between Two Variables',
    tagline: 'Contingency tables, scatter plots, covariance and correlation',
    intro:
      'Now we look at **two** variables together. For two categorical variables we use contingency tables and row/column proportions. For two numerical variables we use scatter plots, **covariance** and the **Pearson correlation coefficient**. The point-biserial coefficient handles one numerical and one binary variable.',
    concepts: [
      '**Contingency table**: counts for each combination of two categorical variables; marginal totals sit on the edges.',
      'Row (or column) **relative frequencies** reveal association: if they differ across rows, the variables are associated.',
      '**Scatter plot**: look for direction (positive/negative), form (linear/curved) and strength.',
      '**Covariance** gives direction but depends on units. **Correlation** $r$ is unit-free and lies in $[-1, 1]$.',
      '$r$ measures only *linear* association; $r = 0$ does not mean "no relationship".',
      '**Point-biserial** correlation: one variable numerical, the other dichotomous.',
    ],
    formulas: [
      { label: 'Covariance (sample)', tex: '\\operatorname{cov}(x,y) = \\dfrac{1}{n-1}\\sum (x_i-\\bar{x})(y_i-\\bar{y})' },
      { label: 'Pearson correlation', tex: 'r = \\dfrac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum (x_i-\\bar x)^2}\\,\\sqrt{\\sum (y_i-\\bar y)^2}}' },
      { label: 'Point-biserial', tex: 'r_{pb} = \\dfrac{\\bar{y}_1-\\bar{y}_0}{s_y}\\sqrt{\\dfrac{n_1 n_0}{n(n-1)}}' },
    ],
    tips: [
      'Correlation is unchanged by shifting either variable, and by scaling with positive constants.',
      'For "what is $y$ when $x = \\dots$" on an exact straight-line scatter plot, find the line through two points.',
    ],
  },
  {
    n: 5,
    title: 'Counting Principles',
    tagline: 'Addition and multiplication rules, factorials',
    intro:
      'Probability on finite sample spaces is mostly **counting**. The two basic rules: if a task can be done in one of several *mutually exclusive* ways, **add**; if it is done in *successive stages*, **multiply**. Factorials count the ways to order distinct objects.',
    concepts: [
      '**Addition rule**: $m$ ways OR $n$ ways (disjoint) gives $m + n$ ways.',
      '**Multiplication rule**: $m$ ways THEN $n$ ways gives $m \\times n$ ways.',
      '**Factorial**: $n! = n(n-1)\\cdots 1$, with $0! = 1$.',
      'With repetition allowed, each position has the full set of choices; without repetition, choices shrink by one each time.',
    ],
    formulas: [
      { label: 'Factorial', tex: 'n! = n \\times (n-1) \\times \\cdots \\times 2 \\times 1' },
      { label: 'Strings with repetition', tex: '\\text{(choices)}^{\\text{length}} = n^k' },
    ],
    tips: [
      'Break codes and passwords into positions and fill the most restricted position first.',
      'Use the complement: total − (ways that break the rule).',
    ],
  },
  {
    n: 6,
    title: 'Permutations & Combinations',
    tagline: 'Arrangements, selections, circular and repeated objects',
    intro:
      '**Permutations** count ordered arrangements; **combinations** count unordered selections. Most exam questions add a twist: identical letters, people who must sit together, objects that cannot be adjacent, or seats around a circle.',
    concepts: [
      'Ordered selection of $r$ from $n$: $^nP_r$. Unordered: $\\binom{n}{r}$.',
      '**Repeated objects**: divide by the factorial of each repeat count.',
      '**Circular arrangements** of $n$ distinct people: $(n-1)!$.',
      '**Together**: glue the group into one block, then arrange inside the block.',
      '**Not adjacent (gap method)**: arrange the others first, then place the restricted items in the gaps.',
      '$\\binom{n}{r} = \\binom{n}{n-r}$ and $\\binom{n}{r} = \\binom{n-1}{r-1} + \\binom{n-1}{r}$ (Pascal).',
    ],
    formulas: [
      { label: 'Permutations', tex: '^{n}P_{r} = \\dfrac{n!}{(n-r)!}' },
      { label: 'Combinations', tex: '\\dbinom{n}{r} = \\dfrac{n!}{r!\\,(n-r)!}' },
      { label: 'With repeats', tex: '\\dfrac{n!}{n_1!\\,n_2!\\cdots n_k!}' },
      { label: 'Circular', tex: '(n-1)!' },
    ],
    tips: [
      'Ask "does order matter?" before choosing $P$ or $C$.',
      'For "at least one", it is usually easier to compute total − none.',
      'Digits in strictly increasing order: choose the digits, and the order is fixed (one arrangement).',
    ],
  },
  {
    n: 7,
    title: 'Probability Basics',
    tagline: 'Sample spaces, events, axioms and properties',
    intro:
      'A **random experiment** has a set of possible outcomes, the **sample space** $S$. An **event** is a subset of $S$. Probability assigns a number in $[0, 1]$ to each event following three axioms, and every rule you use (complement, union, etc.) follows from them.',
    concepts: [
      '**Equally likely outcomes**: $P(E) = |E| / |S|$.',
      '**Complement**: $P(E^c) = 1 - P(E)$.',
      '**Union** of two events: inclusion–exclusion.',
      '**Mutually exclusive** events cannot happen together: $P(A \\cap B) = 0$.',
      'De Morgan: $(A\\cup B)^c = A^c \\cap B^c$, so "neither A nor B" $= 1 - P(A\\cup B)$.',
    ],
    formulas: [
      { label: 'Classical', tex: 'P(E) = \\dfrac{|E|}{|S|}' },
      { label: 'Complement', tex: 'P(E^c) = 1 - P(E)' },
      { label: 'Union', tex: 'P(A\\cup B) = P(A) + P(B) - P(A\\cap B)' },
      { label: 'Three events', tex: 'P(A\\cup B\\cup C) = \\sum P(A) - \\sum P(A\\cap B) + P(A\\cap B\\cap C)' },
    ],
    tips: [
      'Card questions: 52 cards, 4 suits × 13 ranks, 12 face cards — watch for overlap like "King or Heart".',
      'Combine with week 5–6 counting: probability = favourable count ÷ total count.',
    ],
  },
  {
    n: 8,
    title: 'Conditional Probability & Bayes',
    tagline: 'Multiplication rule, independence, total probability, Bayes’ theorem',
    intro:
      '**Conditional probability** $P(A \\mid B)$ updates the probability of $A$ once you know $B$ has happened. It leads to the multiplication rule, the definition of **independence**, the **law of total probability**, and **Bayes’ theorem** for reasoning backwards from an observed effect to its cause.',
    concepts: [
      '$P(A\\mid B)$ restricts the sample space to $B$.',
      '**Multiplication rule** for sequential draws (e.g. without replacement).',
      '**Independent** events: $P(A\\cap B) = P(A)P(B)$. Independence is *not* the same as mutually exclusive.',
      '**Total probability**: split by a partition $B_1,\\dots,B_k$ of the sample space.',
      '**Bayes**: reverse the conditioning — "given the student passed, which teacher set the paper?"',
      'A tree diagram is the fastest way to organise total probability and Bayes questions.',
    ],
    formulas: [
      { label: 'Conditional', tex: 'P(A\\mid B) = \\dfrac{P(A\\cap B)}{P(B)}' },
      { label: 'Multiplication', tex: 'P(A\\cap B) = P(B)\\,P(A\\mid B)' },
      { label: 'Total probability', tex: 'P(A) = \\sum_{i} P(B_i)\\,P(A\\mid B_i)' },
      { label: 'Bayes', tex: 'P(B_j\\mid A) = \\dfrac{P(B_j)P(A\\mid B_j)}{\\sum_i P(B_i)P(A\\mid B_i)}' },
    ],
    tips: [
      '"Given that at least one…" — the condition is the denominator; count it with the complement.',
      'Draw a tree: multiply along branches, add across branches.',
    ],
  },
  {
    n: 9,
    title: 'Random Variables',
    tagline: 'Discrete & continuous random variables, PMF and CDF',
    intro:
      'A **random variable** turns each outcome of an experiment into a number. A **discrete** random variable takes countably many values and is described by its **probability mass function** (PMF); every random variable has a **cumulative distribution function** (CDF).',
    concepts: [
      'PMF: $p(x) = P(X = x)$, with $p(x) \\ge 0$ and $\\sum p(x) = 1$.',
      'CDF: $F(x) = P(X \\le x)$ — non-decreasing, right-continuous, from 0 to 1.',
      'For discrete $X$, the CDF is a step function; jumps equal the PMF values.',
      '$P(a < X \\le b) = F(b) - F(a)$.',
      'Functions of a random variable: build the PMF of $Y = g(X)$ by grouping values.',
    ],
    formulas: [
      { label: 'PMF sums to 1', tex: '\\sum_{x} P(X=x) = 1' },
      { label: 'CDF', tex: 'F(x) = P(X\\le x) = \\sum_{t\\le x} p(t)' },
      { label: 'Interval', tex: 'P(a < X \\le b) = F(b) - F(a)' },
    ],
    tips: [
      'If a PMF has an unknown constant $k$, use $\\sum p(x) = 1$ to find it first.',
      'Be careful with $<$ vs $\\le$ when reading a discrete CDF.',
    ],
  },
  {
    n: 10,
    title: 'Expectation & Variance',
    tagline: 'Expected value and variance of discrete random variables',
    intro:
      'The **expected value** $E(X)$ is the long-run average of a random variable; the **variance** measures how far it typically falls from that average. Both follow simple linearity rules that make complicated questions quick.',
    concepts: [
      '$E(X) = \\sum x\\,p(x)$; $E(g(X)) = \\sum g(x)\\,p(x)$.',
      'Linearity: $E(aX + b) = aE(X) + b$, and $E(X+Y) = E(X) + E(Y)$ always.',
      '$\\operatorname{Var}(aX + b) = a^2\\operatorname{Var}(X)$.',
      'For independent $X, Y$: $\\operatorname{Var}(X+Y) = \\operatorname{Var}(X)+\\operatorname{Var}(Y)$.',
      'Standard deviation $= \\sqrt{\\operatorname{Var}(X)}$.',
    ],
    formulas: [
      { label: 'Expectation', tex: 'E(X) = \\sum_x x\\,P(X=x)' },
      { label: 'Variance', tex: '\\operatorname{Var}(X) = E(X^2) - [E(X)]^2' },
      { label: 'Linear transform', tex: 'E(aX+b) = aE(X)+b,\\quad \\operatorname{Var}(aX+b) = a^2\\operatorname{Var}(X)' },
    ],
    tips: [
      'Compute $E(X)$ and $E(X^2)$ in one table, then use the shortcut for variance.',
      'Games/bets: expected gain = Σ (payoff × probability).',
    ],
  },
  {
    n: 11,
    title: 'Binomial & Poisson',
    tagline: 'Bernoulli trials, binomial and Poisson distributions',
    intro:
      'A **Bernoulli trial** has two outcomes, success with probability $p$. Counting successes in $n$ independent trials gives a **binomial** random variable. When events occur at a constant average rate $\\lambda$ over time or space, the count follows a **Poisson** distribution.',
    concepts: [
      'Binomial needs: fixed $n$, two outcomes, constant $p$, independent trials.',
      '$X \\sim \\text{Bin}(n,p)$: mean $np$, variance $np(1-p)$.',
      '$X \\sim \\text{Poisson}(\\lambda)$: mean $=$ variance $= \\lambda$.',
      'Rescale $\\lambda$ to the interval asked (per hour → per 3 hours: multiply by 3).',
      'Poisson approximates binomial when $n$ is large and $p$ small, with $\\lambda = np$.',
    ],
    formulas: [
      { label: 'Binomial PMF', tex: 'P(X=k) = \\dbinom{n}{k} p^k (1-p)^{n-k}' },
      { label: 'Binomial moments', tex: 'E(X) = np,\\quad \\operatorname{Var}(X) = np(1-p)' },
      { label: 'Poisson PMF', tex: 'P(X=k) = \\dfrac{e^{-\\lambda}\\lambda^k}{k!}' },
      { label: 'Poisson moments', tex: 'E(X) = \\operatorname{Var}(X) = \\lambda' },
    ],
    tips: [
      '"At least one" → $1 - P(X = 0)$.',
      'Given mean and variance of a binomial, solve $1-p = \\text{Var}/\\text{mean}$ first.',
    ],
  },
  {
    n: 12,
    title: 'Continuous Random Variables',
    tagline: 'PDFs, area under the curve, uniform and exponential distributions',
    intro:
      'A **continuous** random variable takes values in an interval. Probabilities are **areas under the probability density function** (PDF); the probability of any single exact value is 0. The **uniform** and **exponential** distributions are the two key examples in this course.',
    concepts: [
      'PDF $f(x) \\ge 0$ with total area 1; $P(a \\le X \\le b) = \\int_a^b f(x)\\,dx$.',
      'For continuous $X$: $P(X = a) = 0$, so $<$ and $\\le$ give the same answer.',
      '**Uniform** $U(a,b)$: flat density $1/(b-a)$.',
      '**Exponential**($\\lambda$): waiting times; memoryless — $P(X > s+t \\mid X > s) = P(X > t)$.',
      'CDF $F(x) = \\int_{-\\infty}^{x} f(t)\\,dt$ and $f = F\'$.',
    ],
    formulas: [
      { label: 'Uniform', tex: 'f(x) = \\dfrac{1}{b-a},\\; E(X) = \\dfrac{a+b}{2},\\; \\operatorname{Var}(X) = \\dfrac{(b-a)^2}{12}' },
      { label: 'Exponential', tex: 'f(x) = \\lambda e^{-\\lambda x},\\; P(X>x) = e^{-\\lambda x}' },
      { label: 'Exponential moments', tex: 'E(X) = \\dfrac{1}{\\lambda},\\quad \\operatorname{Var}(X) = \\dfrac{1}{\\lambda^2}' },
    ],
    tips: [
      'For piecewise PDFs, sketch the graph — areas of triangles/rectangles are often faster than integrals.',
      'Use the constant-finding step $\\int f = 1$ before anything else.',
    ],
  },
];

export const weekByNumber = (n: number) => WEEKS.find((w) => w.n === n);
