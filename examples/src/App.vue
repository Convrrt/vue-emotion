<template>
  <GlobalStyle />
  <img alt="Vue logo" src="./assets/logo.png" />
  <Button
    class="hello"
    @click="() => count++"
  >
    {{count}}
  </Button>

  <BlueButton
    class="hello"
    @click="() => count++"
  >
    {{count * 2}}
  </BlueButton>
  <Input :value="initialInput" />
  <Input2 :value="initialInput2" @input="(e) => {
    initialInput2 = e.target.value
  }"/>
</template>

<script>

import { styled, createGlobalStyle } from '../../src/index'

const Button = styled('button')`
  color: ${props => props.theme.color};
  font-size: 1rem;
`

const BlueButton = styled(Button)`
  color: blue;
  font-size: 33px;
  background: yellow;
`

const Input = styled('input')`
  border: 1px solid #e2e2e2;
  padding: 10px;
  font-size: 1rem;
`

const Input2 = styled('input')`
  border: 1px solid #e2e2e2;
  padding: ${props => {
    return `${props.$ctx.padding}px;`
  }}
  font-size: 1rem;
`

const GlobalStyle = createGlobalStyle`
  body {
    background: gray;
  }
`

export default {
  name: 'App',
  // mixins: [VueEmotion],
  components: {
    Button,
    BlueButton,
    Input,
    Input2,
    GlobalStyle,
  },
  computed: {
    padding() {
      return 10
    }
  },
  data() {
    return {
      count: 0,
      initialInput: 'some text',
      initialInput2: 'some text',
    }
  }
}
</script>
