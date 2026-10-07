import { describe, expect, it } from 'vitest';
import {
  errorHeadline,
  formatRequest,
  normalizeHash,
  reactFileServers,
  reactFilesInLicense,
  requestsByServer,
  sortByServer,
  type LoggedRequest,
} from './lib';

const req = (port: number, path: string, status = 200): LoggedRequest => ({
  port,
  method: 'GET',
  path,
  status,
});

describe('normalizeHash', () => {
  it('replaces the content hash of a chunk', () => {
    expect(normalizeHash('/static/js/async/i.7745ad3977.js')).toBe('/static/js/async/i.[hash].js');
    expect(normalizeHash('/static/js/remote_b.e160eaab8b.js')).toBe(
      '/static/js/remote_b.[hash].js',
    );
  });
  it('leaves names without a hash alone', () => {
    expect(normalizeHash('/mf-manifest.json')).toBe('/mf-manifest.json');
    expect(normalizeHash('/')).toBe('/');
    expect(normalizeHash('/static/js/a.12345.js')).toBe('/static/js/a.12345.js');
  });
});

describe('formatRequest', () => {
  it('uses the sample format and marks non-200 responses', () => {
    expect(formatRequest(req(3000, '/'))).toBe(':3000  GET /');
    expect(formatRequest(req(3001, '/x.js', 404))).toBe(':3001  GET /x.js (404)');
  });
});

describe('requestsByServer', () => {
  it('groups by port, keeps per-server order, and lists servers that saw nothing', () => {
    const log = [
      req(3000, '/'),
      req(3001, '/mf-manifest.json'),
      req(3000, '/static/js/index.da945bb8f4.js'),
      req(3001, '/static/js/remote_a.71bd68a471.js'),
    ];
    expect(requestsByServer(log, [3000, 3001, 3002])).toEqual({
      ':3000': [':3000  GET /', ':3000  GET /static/js/index.[hash].js'],
      ':3001': [':3001  GET /mf-manifest.json', ':3001  GET /static/js/remote_a.[hash].js'],
      ':3002': [],
    });
  });
});

describe('reactFilesInLicense', () => {
  it('reads each React license header once', () => {
    const license = [
      '/**',
      ' * @license React',
      ' * react-dom-client.production.js',
      ' */',
      '/**',
      ' * @license React',
      ' * scheduler.production.js',
      ' */',
      '/** @license React\n * scheduler.production.js */',
    ].join('\n');
    expect(reactFilesInLicense(license)).toEqual([
      'react-dom-client.production.js',
      'scheduler.production.js',
    ]);
  });
  it('ignores licenses of other packages', () => {
    expect(reactFilesInLicense('/** @license MIT\n * other.js */')).toEqual([]);
  });
});

describe('errorHeadline', () => {
  it('keeps the args line of a federation runtime error and drops the rest', () => {
    const message = [
      '[ Federation Runtime ]: Failed to get manifest. #RUNTIME-003',
      'args: {"manifestUrl":"http://localhost:3002/mf-manifest.json"}',
      'View the docs to see how to solve: https://module-federation.io/',
    ].join('\n');
    expect(errorHeadline(message)).toBe(
      '[ Federation Runtime ]: Failed to get manifest. #RUNTIME-003 args: {"manifestUrl":"http://localhost:3002/mf-manifest.json"}',
    );
  });
  it('keeps only the first line otherwise', () => {
    expect(errorHeadline('TypeError: boom\n    at x.js:1')).toBe('TypeError: boom');
  });
});

describe('React chunks by server', () => {
  const chunks = [
    { request: ':3002  GET /i.[hash].js', reactFiles: ['react.production.js'] },
    { request: ':3000  GET /4.[hash].js', reactFiles: ['react-jsx-runtime.production.js'] },
    { request: ':3002  GET /w.[hash].js', reactFiles: ['react-jsx-runtime.production.js'] },
    { request: ':3002  GET /d.[hash].js', reactFiles: ['react-dom-client.production.js'] },
  ];
  it('sorts by port and keeps each server order', () => {
    expect(sortByServer(chunks).map((c) => c.request)).toEqual([
      ':3000  GET /4.[hash].js',
      ':3002  GET /i.[hash].js',
      ':3002  GET /w.[hash].js',
      ':3002  GET /d.[hash].js',
    ]);
  });
  it('lists the servers per React file', () => {
    expect(reactFileServers(chunks)).toEqual({
      'react-dom-client.production.js': [':3002'],
      'react-jsx-runtime.production.js': [':3000', ':3002'],
      'react.production.js': [':3002'],
    });
  });
});
