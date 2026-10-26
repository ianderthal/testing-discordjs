// test/stravaHelpers.test.js
const { expect } = require('chai');
const { pacePer500m, metersToFormatted } = require('../utils/stravaHelpers');
const { createStravaActivityEmbed } = require('../utils/stravaEmbed');

describe('Rowing helpers', function () {
  it('should format an even 500m split', function () {
    expect(pacePer500m(2000, 480)).to.equal('2:00.0 /500m');
  });

  it('should format a split with tenths of a second', function () {
    expect(pacePer500m(5000, 1253)).to.equal('2:05.3 /500m');
  });

  it('should carry rounding into the next minute', function () {
    // 59.96s per 500m should round up to 1:00.0
    expect(pacePer500m(500, 59.96)).to.equal('1:00.0 /500m');
  });

  it('should pad single-digit seconds', function () {
    expect(pacePer500m(500, 125.5)).to.equal('2:05.5 /500m');
  });

  it('should handle zero distance', function () {
    expect(pacePer500m(0, 600)).to.equal('0:00.0 /500m');
  });

  it('should format meters with a thousands separator', function () {
    expect(metersToFormatted(5000)).to.equal('5,000 m');
    expect(metersToFormatted(1234.6)).to.equal('1,235 m');
  });
});

describe('createStravaActivityEmbed', function () {
  const baseActivity = {
    id: 1,
    name: 'Test Activity',
    distance: 5000,
    moving_time: 1253,
    start_date: '2025-09-13T13:52:00Z',
    timezone: '(GMT-04:00) America/New_York',
  };

  it('should show meters and 500m split for rowing', function () {
    const embed = createStravaActivityEmbed({ ...baseActivity, sport_type: 'Rowing' });
    const values = embed.data.fields.map(f => f.value);
    expect(values).to.include('5,000 m');
    expect(values).to.include('2:05.3 /500m');
  });

  it('should treat VirtualRow as rowing', function () {
    const embed = createStravaActivityEmbed({ ...baseActivity, sport_type: 'VirtualRow' });
    const values = embed.data.fields.map(f => f.value);
    expect(values).to.include('2:05.3 /500m');
  });

  it('should show miles and min/mi for runs', function () {
    const embed = createStravaActivityEmbed({ ...baseActivity, sport_type: 'Run' });
    const values = embed.data.fields.map(f => f.value);
    expect(values).to.include('3.11 mi');
    expect(values.some(v => v.endsWith('min/mi'))).to.equal(true);
  });
});
