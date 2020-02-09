<template>

  <q-layout v-if="maximized" ref="layout" container view="hhh lpr fff" class="bg-white">

    <q-header elevated >
      <slot name="header">
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>{{ context.label }}</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>
      </slot>
    </q-header>

    <q-page-container>
      <q-page padding>
        <slot></slot>
      </q-page>
    </q-page-container>

    <q-footer elevated>
      <slot name="footer">
        <q-toolbar class="bg-grey-9 text-white">
          <q-space />
          <q-btn flat label="Очистити" @click="context.clear" />
          <q-btn label="Застосувати" color="primary" @click="context.apply" :disable="context.disableApply"/>
        </q-toolbar>
      </slot>
    </q-footer>

  </q-layout>

  <q-card v-else style="max-width: 1280px;" :style="layoutStyle">
    <slot name="header">
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>{{ context.label }}</q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>
    </slot>

    <q-separator />

    <q-card-section>
      <slot></slot>
    </q-card-section>

    <q-separator />

    <slot name="footer">
      <q-toolbar class="bg-grey-9 text-white" :class="{'fixed-bottom':maximized}" style="z-index:999;">
        <q-space />
        <q-btn flat label="Очистити" @click="context.clear" />
        <q-btn label="Застосувати" color="primary" @click="context.apply" :disable="context.disableApply"/>
      </q-toolbar>
    </slot>

  </q-card>

</template>

<script>

  export default {
    name: 'DialogLayout',
    props: {
      context: Object
    },
    computed: {
      maximized() {
        return this.context.dialogMaximized || this.$q.screen.lt.md;
      },
      layoutStyle() {
        return this.maximized ? null : {width: this.context.dialogWidth};
      }
    }
  }
</script>
