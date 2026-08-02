export class EnterpriseKnowledgeGraph {

  constructor() {

    this.graph = new Map();

    this.initialize();

  }

  //--------------------------------------------------
  // Initialize Core SAP Knowledge Graph

  initialize() {

    this.add(

      "SAP GRC",

      [

        "ARA",

        "ARM",

        "EAM",

        "BRM",

        "MSMP",

        "BRF+",

        "Firefighter",

        "Risk Analysis"

      ]

    );

    this.add(

      "SAP Security",

      [

        "PFCG",

        "SU24",

        "SU25",

        "SU01",

        "Authorization Objects",

        "Roles",

        "Profiles"

      ]

    );

    this.add(

      "SAP Cloud Identity",

      [

        "IAS",

        "IPS",

        "IAG",

        "Identity Federation",

        "SAML",

        "OAuth2",

        "OIDC"

      ]

    );

    this.add(

      "SAP Integration",

      [

        "SM59",

        "RFC",

        "SNC",

        "SAP Web Dispatcher",

        "SAP Cloud Connector",

        "Technical Communication Users",

        "mTLS",

        "Certificates"

      ]

    );

    this.add(

      "SAP Fiori",

      [

        "Launchpad",

        "Business Roles",

        "Catalogs",

        "Spaces",

        "Pages",

        "OData",

        "Gateway"

      ]

    );

    this.add(

      "SAP HANA",

      [

        "CDS",

        "DCL",

        "Analytical Privileges",

        "SQL",

        "Calculation Views"

      ]

    );

    this.add(

      "SAP BTP",

      [

        "Cloud Foundry",

        "Kyma",

        "Destinations",

        "Connectivity",

        "Principal Propagation"

      ]

    );

  }

  //--------------------------------------------------

  add(parent, children) {

    this.graph.set(parent, children);

  }

  //--------------------------------------------------

  getRelated(topic = "") {

    const related = new Set();

    const search = topic.toLowerCase();

    for (const [parent, children] of this.graph.entries()) {

      if (

        parent.toLowerCase().includes(search)

      ) {

        children.forEach(c => related.add(c));

      }

      children.forEach(child => {

        if (

          child.toLowerCase().includes(search)

        ) {

          related.add(parent);

          children.forEach(c => related.add(c));

        }

      });

    }

    return Array.from(related);

  }

  //--------------------------------------------------

  enrichComponents(components = []) {

    const enriched = new Set(components);

    components.forEach(component => {

      this.getRelated(component)

        .forEach(item =>

          enriched.add(item)

        );

    });

    return Array.from(enriched);

  }

  //--------------------------------------------------

  suggestMissingComponents(

    answer = "",

    expected = []

  ) {

    const text = answer.toLowerCase();

    return expected.filter(component =>

      !text.includes(

        component.toLowerCase()

      )

    );

  }

}

export const enterpriseKnowledgeGraph =
  new EnterpriseKnowledgeGraph();