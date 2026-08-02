export class InterviewMemory {

  constructor(maxQuestions = 10) {

    this.maxQuestions = maxQuestions;

    this.history = [];

  }

  //------------------------------------
  // Add Interview Turn

  add({

    question,

    analysis,

    reasoningPlan,

    sapComponents,

    answer,

    evaluation

  }) {

    this.history.push({

      timestamp: Date.now(),

      question,

      analysis,

      reasoningPlan,

      sapComponents,

      answer,

      evaluation

    });

    if (

      this.history.length >

      this.maxQuestions

    ) {

      this.history.shift();

    }

  }

  //------------------------------------
  // Previous Questions

  getPreviousQuestions() {

    return this.history.map(

      item => item.question

    );

  }

  //------------------------------------
  // Frequently Used Components

  getFrequentComponents() {

    const map = {};

    this.history.forEach(item => {

      (item.sapComponents || []).forEach(component => {

        map[component] =

          (map[component] || 0) + 1;

      });

    });

    return Object.entries(map)

      .sort((a,b)=>b[1]-a[1])

      .map(x=>x[0]);

  }

  //------------------------------------
  // Weak Areas

  getWeakAreas() {

    const weak = [];

    this.history.forEach(item => {

      if (

        item.evaluation?.overallScore < 9.3

      ) {

        weak.push({

          question: item.question,

          score: item.evaluation.overallScore,

          findings:

            item.evaluation.findings

        });

      }

    });

    return weak;

  }

  //------------------------------------
  // Recently Used Topics

  getRecentDomains() {

    return [

      ...new Set(

        this.history.map(

          h => h.analysis.domain

        )

      )

    ];

  }

  //------------------------------------
  // Interview Context

  buildContext() {

    return {

      previousQuestions:

        this.getPreviousQuestions(),

      frequentComponents:

        this.getFrequentComponents(),

      weakAreas:

        this.getWeakAreas(),

      recentDomains:

        this.getRecentDomains()

    };

  }

  //------------------------------------

  clear() {

    this.history = [];

  }

}

export const interviewMemory =
  new InterviewMemory();