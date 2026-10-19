import { describe, expect, it } from 'vitest';
import { buildRepository, buildWorkspace } from '../../test/unit/fakes';
import { FindWorkspaceService } from './FindWorkspaceService';

const workspaces = [
  buildWorkspace({ id: 'api', name: 'Payments API', folders: ['/srv/pay'] }),
  buildWorkspace({ id: 'web', name: 'Website', folders: ['/srv/frontend'] }),
  buildWorkspace({ id: 'ops', name: 'Infra', tags: ['DevOps'] }),
];

describe('FindWorkspaceService', () => {
  const { repository } = buildRepository(workspaces);
  const service = new FindWorkspaceService(repository);

  it.each(['', '   '])('returns everything for blank query "%s"', (query) => {
    expect(service.search(query)).toHaveLength(3);
  });

  it('matches by name ignoring case', () => {
    expect(service.search('payments').map((ws) => ws.id)).toEqual(['api']);
  });

  it('matches by folder path', () => {
    expect(service.search('FRONTEND').map((ws) => ws.id)).toEqual(['web']);
  });

  it('matches by tag', () => {
    expect(service.search('devops').map((ws) => ws.id)).toEqual(['ops']);
  });

  it('returns nothing when no field matches', () => {
    expect(service.search('nothing-here')).toEqual([]);
  });
});
