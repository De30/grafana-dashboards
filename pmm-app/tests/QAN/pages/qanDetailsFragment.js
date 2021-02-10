const assert = require('assert');

const { I } = inject();

module.exports = {
  root: '$query-analytics-details',
  fields: {},
  buttons: {
    close: '//div[@role="tablist"]//button/span[text()="Close"]',
  },
  elements: {
    resizer: 'span.Resizer.horizontal',
    noExamples: '//pre[contains(text(), "Sorry, no examples found for this query")]',
    noClassic: '//pre[contains(text(), "No classic explain found")]',
    noJSON: '//pre[contains(text(), "No JSON explain found")]',
    examplesCodeBlock: '$pmm-overlay-wrapper',
  },

  getFilterSectionLocator: (filterSectionName) => `//span[contains(text(), '${filterSectionName}')]`,

  getTabLocator: (tabName) => `//span[contains(text(), '${tabName}')]`,

  getMetricsCellLocator: (metricName, columnNumber) => `//td//span[contains(text(), "${metricName}")]/ancestor::tr/td[${columnNumber}]//span[1]`,

  async verifyAvqQueryCount() {
    const qpsvalue = await I.grabTextFrom(this.getMetricsCellLocator('Query Count', 2));
    const queryCountDetail = await I.grabTextFrom(this.getMetricsCellLocator('Query Count', 3));

    // We divide by 300 because we are using last 5 mins filter.
    const result = (parseFloat(queryCountDetail) / 300).toFixed(4);

    compareCalculation(qpsvalue, result);
  },

  checkExamplesTab() {
    I.waitForVisible(this.getTabLocator('Example'), 30);
    I.click(this.getTabLocator('Example'));
    I.waitForVisible(this.elements.examplesCodeBlock, 30);
    I.dontSeeElement(this.elements.noExamples);
  },

  checkExplainTab() {
    I.click(this.getTabLocator('Explain'));
    I.wait(5);
    I.dontSeeElement(this.elements.noClassic);
    I.dontSeeElement(this.elements.noJSON);
  },

  async verifyAvgQueryTime() {
    const timeLocator = this.getMetricsCellLocator('Query Time', 4);
    const countLocator = this.getMetricsCellLocator('Query Count', 3);
    const loadLocator = this.getMetricsCellLocator('Query Time', 2);

    /* eslint-disable prefer-const */
    let [perQueryStats, perQueryUnit] = (await I.grabTextFrom(timeLocator)).split(' ');

    if (perQueryUnit === 'ms') perQueryStats /= 1000;

    if (perQueryUnit === 'µs') perQueryStats /= 1000000;

    const queryCountDetail = await I.grabTextFrom(countLocator);
    const [load] = (await I.grabTextFrom(loadLocator)).split(' ');
    const result = ((parseFloat(queryCountDetail) * parseFloat(perQueryStats)) / 300).toFixed(4);

    compareCalculation(load, result);
  },
};

function compareCalculation(value, result) {
  const caller = compareCalculation.caller.name;

  switch (true) {
    case result < 0.01:
      assert.ok(value.startsWith('<0.01'), `Values don't match in the ${caller} method. Value: ${value}`);
      break;
    case parseFloat(result) <= 0.0149:
      assert.ok(value.startsWith('0.01'), `Values don't match in the ${caller} method. Value: ${value}`);
      break;
    default:
      assert.ok(parseFloat(parseFloat(result).toFixed(2)) === parseFloat(value), `Values don't match in the ${caller} method. Value: ${value}`);
  }
}