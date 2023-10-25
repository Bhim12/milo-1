import { heading, languages, urls, statuses, renderSignal } from '../utils/state.js';
import { setStatus } from '../utils/status.js';
import { autoSetup } from '../floodgate/index.js';
import getServiceConfig from '../../../utils/service-config.js';
import { getServiceUpdates, startSync } from '../utils/miloc.js';

export default async function handleRefresh() {
  if (heading.value.projectId) {
    const { miloc } = await getServiceConfig(origin);
    if (!miloc) {
      setStatus(
        'service',
        'error',
        'No Milo Floodgate config',
        'Check /.milo/config in your project.',
      );
      return;
    }
    try {
      await startSync(miloc.url);
      await getServiceUpdates(miloc.url, 'created');
    } catch {
      console.log('something wrong');
    }
  } else {
    languages.value = [];
    urls.value = [];
    statuses.value = {};
    renderSignal.value = renderSignal.value + 1;
    autoSetup();
  }
}
