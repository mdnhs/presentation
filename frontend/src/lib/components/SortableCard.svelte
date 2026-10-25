<script>
  // One board card as a dnd-kit sortable: sorts within its column and moves between columns.
  import { createSortable } from '@dnd-kit/svelte/sortable'
  import ProjectCard from './ProjectCard.svelte'

  let { project, index, group, onopen, disabled = false } = $props()

  // Getters keep the sortable in sync as the card moves (index) or changes column (group).
  const sortable = createSortable({
    get id() {
      return project.id
    },
    get index() {
      return index
    },
    get group() {
      return group
    },
    get disabled() {
      return disabled
    },
    type: 'project',
    accept: 'project',
  })
</script>

<!-- The sortable sits on the card's own button: dnd-kit ignores drags that start on a nested button. -->
<div class="rounded-xl transition-opacity duration-150 {sortable.isDragging ? 'z-10 opacity-90 [&>button]:rotate-1 [&>button]:shadow-lift' : ''}">
  <ProjectCard {project} {onopen} {@attach sortable.attach} class={disabled ? 'cursor-default' : `touch-none ${sortable.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} />
</div>
