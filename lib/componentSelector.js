export function selectSapComponents(question = "", analysis = {}) {

  const q = question.toLowerCase();

  const components = [];

  const add = (...items) => {
    items.forEach(item => {
      if (!components.includes(item))
        components.push(item);
    });
  };

  // SAP GRC

  if (/(arm|access request)/i.test(q))
    add(
      "ARM",
      "MSMP",
      "BRF+",
      "ARA",
      "Provisioning Framework"
    );

  if (/(ara|risk|sod)/i.test(q))
    add(
      "ARA",
      "Risk Rules",
      "Mitigation Controls",
      "Risk IDs"
    );

  if (/(eam|firefighter)/i.test(q))
    add(
      "EAM",
      "Firefighter IDs",
      "Controllers",
      "Log Review"
    );

  // SAP Security

  if (/(authorization|role|pfcg|su24|su25|su01)/i.test(q))
    add(
      "PFCG",
      "SU24",
      "SU25",
      "SU01",
      "Authorization Objects"
    );

  // Integration

  if (/(integration|rfc|api|interface|connector)/i.test(q))
    add(
      "SM59",
      "SNC",
      "SAP Web Dispatcher",
      "SAP Cloud Connector",
      "Technical Communication Users",
      "Certificates",
      "mTLS"
    );

  // Cloud Identity

  if (/(ias|ips|iag|identity)/i.test(q))
    add(
      "IAS",
      "IPS",
      "IAG",
      "Identity Provisioning",
      "SAML 2.0",
      "OAuth2"
    );

  // Fiori

  if (/(fiori|launchpad|catalog|space|page)/i.test(q))
    add(
      "Catalogs",
      "Business Roles",
      "Spaces",
      "Pages",
      "OData Services"
    );

  // HANA

  if (/(hana|dcl|cds)/i.test(q))
    add(
      "CDS",
      "DCL",
      "Analytical Privileges"
    );

  // Defense / Government

  if (analysis.industry === "Defense" ||
      analysis.industry === "Government") {

    add(
      "Zero Trust",
      "Least Privilege",
      "Network Segmentation",
      "Audit Logging",
      "Data Sovereignty"
    );

  }

  return components;

}
