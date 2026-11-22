// test/stravaHelpers.test.js
const { expect } = require('chai');
const { pacePer500m, metersToFormatted, stravaId, stravaWebhookReviver, profilePictureUrl } = require('../utils/stravaHelpers');
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

  it('should show only elapsed duration for tennis', function () {
    const embed = createStravaActivityEmbed({ ...baseActivity, distance: 0, moving_time: 1800, elapsed_time: 5400, sport_type: 'Tennis' });
    expect(embed.data.fields).to.have.lengthOf(1);
    expect(embed.data.fields[0].name).to.equal('Duration:');
    expect(embed.data.fields[0].value).to.equal('1h30m00s');
  });

  it('should show miles and min/mi for runs', function () {
    const embed = createStravaActivityEmbed({ ...baseActivity, sport_type: 'Run' });
    const values = embed.data.fields.map(f => f.value);
    expect(values).to.include('3.11 mi');
    expect(values.some(v => v.endsWith('min/mi'))).to.equal(true);
  });

  it('should link to the activity using id_str', function () {
    // eslint-disable-next-line no-loss-of-precision -- simulates a lossy numeric 64-bit id
    const embed = createStravaActivityEmbed({ ...baseActivity, sport_type: 'Run', id: 9223372036854775807, id_str: '9223372036854775807' });
    expect(embed.data.url).to.equal('https://strava.com/activities/9223372036854775807');
  });
});

describe('stravaId', function () {
  it('should prefer id_str over a lossy numeric id', function () {
    // eslint-disable-next-line no-loss-of-precision -- simulates a lossy numeric 64-bit id
    expect(stravaId({ id: 9223372036854775807, id_str: '9223372036854775807' })).to.equal('9223372036854775807');
  });

  it('should fall back to id when id_str is missing', function () {
    expect(stravaId({ id: 12345 })).to.equal('12345');
  });
});

describe('stravaWebhookReviver', function () {
  it('should keep 64-bit webhook IDs exact as strings', function () {
    const body = JSON.parse(
      '{"aspect_type":"create","object_id":9223372036854775807,"owner_id":9007199254740993,"event_time":1700000000}',
      stravaWebhookReviver,
    );
    expect(body.object_id).to.equal('9223372036854775807');
    expect(body.owner_id).to.equal('9007199254740993');
    expect(body.event_time).to.equal(1700000000);
  });
});

describe('profilePictureUrl', function () {
  it('should prefer profile_medium when present', function () {
    const athlete = {
      profile_medium: 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/1/2/3/medium.jpg',
      profile: 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/1/2/3/large.jpg'
    };
    expect(profilePictureUrl(athlete)).to.equal(athlete.profile_medium);
  });

  it('should convert a large.jpg profile URL to medium', function () {
    const athlete = { profile: 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/1/2/3/large.jpg' };
    expect(profilePictureUrl(athlete)).to.equal('https://dgalywyr863hv.cloudfront.net/pictures/athletes/1/2/3/medium.jpg');
  });

  it('should return null for the no-photo placeholder', function () {
    expect(profilePictureUrl({ profile: 'avatar/athlete/large.png', profile_medium: 'avatar/athlete/medium.png' })).to.equal(null);
  });

  it('should return null when no profile is present', function () {
    expect(profilePictureUrl({})).to.equal(null);
  });
});
