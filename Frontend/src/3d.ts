import {
    Animator,
    AnimatorControllerLayer,
    AnimatorLayerBlendingMode,
    AnimatorStateMachine,
    AnimatorStateTransition,
    AssetType,
    BackgroundMode,
    BackgroundTextureFillMode,
    Camera,
    DirectLight,
    Engine,
    Entity,
    GLTFResource,
    Texture2D,
    WebGLEngine,
    WrapMode,
} from "@galacean/engine";
import EVENT_BUS from "@/event";
import {config} from "@/config";

let rootEntity: Entity = null

export async function create3D() {
    const engine = await WebGLEngine.create({canvas: "canvas"});
    engine.canvas.resizeByClientSize();

    const em = document.getElementById('canvas')
    window.onresize = () => {
        engine.canvas.resizeByClientSize()
    }

    rootEntity = engine.sceneManager.scenes[0].createRootEntity();

    const cameraEntity = rootEntity.createChild("camera");
    const camera = cameraEntity.addComponent(Camera);
    camera.enableFrustumCulling = false
    camera.fieldOfView = 13
    cameraEntity.transform.setPosition(0, 1.1, 11);

    engine.sceneManager.scenes[0].ambientLight.diffuseSolidColor.set(
        .8,
        .8,
        .8,
        1
    );

    const lightEntity = rootEntity.createChild('light')
    const light = lightEntity.addComponent(DirectLight)
    light.color.set(.7, .7, .7, 1)
    lightEntity.transform.setRotation(-45, 0, 0)

    await LoadSkybox(engine, config)
    await LoadModel(engine, config)
    engine.run()
}

async function LoadSkybox(engine: Engine, config: any) {
    const bg = config.background ?? 'assets/background.png'
    const backgroundTexture = await engine.resourceManager.load<Texture2D>({
        urls: [
            bg
        ],
        type: AssetType.Texture2D
    })

    const background = engine.sceneManager.scenes[0].background
    background.mode = BackgroundMode.Texture
    background.texture = backgroundTexture
    background.textureFillMode = BackgroundTextureFillMode.AspectFitHeight
}

async function LoadModel(engine: Engine, config: any) {
    const glb = await engine.resourceManager.load<GLTFResource>(config.model)
    const glbRoot = glb.instantiateSceneRoot()
    rootEntity.addChild(glbRoot)
    glbRoot.transform.setPosition(0, 0, 0)
    glbRoot.transform.setScale(1, 1, 1)

    const animator = glbRoot.getComponent(Animator)

    const ctrl = animator.animatorController
    const layers = ctrl.layers
    const baseLayer = layers[0]
    baseLayer.stateMachine.defaultState = animator.findAnimatorState('idle')
    const helloState = animator.findAnimatorState('hello')
    const idleState = animator.findAnimatorState('idle')
    const talkingState = animator.findAnimatorState('talking')
    const toDefault = new AnimatorStateTransition()
    toDefault.destinationState = idleState
    helloState.addTransition(toDefault)
    helloState.wrapMode = WrapMode.Once
    talkingState.addTransition(toDefault)
    talkingState.wrapMode = WrapMode.Once
    animator.play('hello')
    const faceLayer = new AnimatorControllerLayer('additive')
    ctrl.addLayer(faceLayer)
    faceLayer.stateMachine = new AnimatorStateMachine()
    faceLayer.blendingMode = AnimatorLayerBlendingMode.Additive
    faceLayer.weight = 1

    let faceTalking
    for (let animation of glb.animations) {
        const state = animator.findAnimatorState(animation.name)
        // state.wrapMode = WrapMode.Once
        if (animation.name === 'face_talk') {
            ctrl.layers[0].stateMachine.removeState(state)
            faceTalking = ctrl.findLayerByName('additive').stateMachine.addState('face_talk')
            faceTalking.speed = 2
            faceTalking.clip = animation
        }
    }

    EVENT_BUS.on('talk_start', () => {
        if (faceTalking) {
            faceTalking.wrapMode = WrapMode.Loop
        }
        animator.play('face_talk')
        talkingState.wrapMode = WrapMode.Loop
        animator.play('talking')
    })
    EVENT_BUS.on('talk_end', () => {
        if (faceTalking) {
            faceTalking.wrapMode = WrapMode.Once
        }
        talkingState.wrapMode = WrapMode.Once
    })
}