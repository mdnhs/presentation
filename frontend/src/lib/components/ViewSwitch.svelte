<script>
  // Spreadsheet / Kanban switcher between the two project views.
  import { route } from '../router.svelte.js'
  import Icon from './Icon.svelte'

  const VIEWS = [
    { path: '/list', label: 'Spreadsheet', icon: 'table' },
    { path: '/board', label: 'Kanban', icon: 'kanban' },
  ]
</script>

<nav class="groove" aria-label="Project views">
  {#each VIEWS as v (v.path)}
    <a href="#{v.path}" class="groove-item" aria-current={route.path === v.path ? 'page' : undefined}>
      {v.label} <Icon name={v.icon} size={14} />
    </a>
  {/each}
</nav>
