// =====================================================
// HOLOGRAPHIC AVATAR SYSTEM FOR AI CONSCIOUSNESS LAB
// =====================================================

// ADD THIS CLASS FIRST - It was missing!
class HybridAvatarGenerator {
    constructor() {
        this.particleSystem = null;
        this.shaderEffects = null;
    }
    
    /**
     * Generate a simple 3D avatar for now
     * We'll enhance this later
     */
    async generateDynamicAvatar(consciousness) {
        // Create THREE.js group for the avatar
        const avatarGroup = new THREE.Group();
        avatarGroup.name = 'dynamic3DAvatar';
        
        // 1. Create core sphere based on traits
        const coreGeometry = new THREE.SphereGeometry(1, 32, 32);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: this.getTraitColor(consciousness),
            emissive: this.getTraitColor(consciousness),
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8,
            wireframe: consciousness.traits.chaos > 70
        });
        
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        coreMesh.name = 'avatarCore';
        avatarGroup.add(coreMesh);
        
        // 2. Add personality rings
        consciousness.personalities.forEach((personality, index) => {
            const ringGeometry = new THREE.TorusGeometry(
                1.5 + index * 0.3,  // radius
                0.05,               // tube
                16,                 // radial segments
                100                 // tubular segments
            );
            
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: this.getPersonalityColor(personality.name),
                transparent: true,
                opacity: 0.6
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI * 0.3 * (index + 1);
            ring.rotation.y = Math.PI * 0.2 * index;
            ring.userData = { 
                personality: personality.name,
                speed: 0.5 + Math.random() * 0.5
            };
            
            avatarGroup.add(ring);
        });
        
        // 3. Add particle cloud
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            // Sphere distribution
            const radius = 2 + Math.random();
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
            
            // Colors based on traits
            if (consciousness.traits.logic > 70) {
                colors[i] = 0;
                colors[i + 1] = 0.5;
                colors[i + 2] = 1;
            } else if (consciousness.traits.chaos > 70) {
                colors[i] = 1;
                colors[i + 1] = 0;
                colors[i + 2] = 0.5;
            } else {
                colors[i] = 0.5;
                colors[i + 1] = 1;
                colors[i + 2] = 0.5;
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, particleMaterial);
        particles.name = 'avatarParticles';
        avatarGroup.add(particles);
        
        return avatarGroup;
    }
    
    getTraitColor(consciousness) {
        const traits = consciousness.traits;
        
        if (traits.logic > 70) return 0x0080ff;
        if (traits.chaos > 70) return 0xff0080;
        if (traits.human > 70) return 0xffaa00;
        return 0x00ff80;
    }
    
    getPersonalityColor(name) {
        const colorMap = {
            'Einstein': 0x0080ff,
            'GLaDOS': 0xff8800,
            'Shakespeare': 0x9932cc,
            'Yoda': 0x00ff00,
            'HAL 9000': 0xff0000,
            'Bob Ross': 0x87ceeb,
            'Wasteland Sage': 0x8b4513,
            'Quantum Entity': 0xff00ff
        };
        
        return colorMap[name] || 0xffffff;
    }
    
    animateAvatar(avatarGroup, time) {
        // Rotate core
        const core = avatarGroup.getObjectByName('avatarCore');
        if (core) {
            core.rotation.y += 0.01;
            core.rotation.x += 0.005;
        }
        
        // Rotate rings
        avatarGroup.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'TorusGeometry') {
                const speed = child.userData.speed || 1;
                child.rotation.z += 0.01 * speed;
            }
        });
        
        // Rotate particles
        const particles = avatarGroup.getObjectByName('avatarParticles');
        if (particles) {
            particles.rotation.y += 0.002;
        }
    }
}

// NOW YOUR ORIGINAL CLASS
class HolographicAvatarSystem {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.avatars = new Map();
        this.activeAvatar = null;
        this.imageCache = new Map();
        
        // Hologram shader uniforms
        this.hologramUniforms = {
            time: { value: 0 },
            opacity: { value: 0.0 },
            scanlineIntensity: { value: 0.3 },
            glitchIntensity: { value: 0.0 },
            colorShift: { value: 0.0 },
            texture: { value: null }
        };
        
        this.init();
    }
    
    init() {
        // Create hologram container
        this.hologramGroup = new THREE.Group();
        this.hologramGroup.name = 'hologramGroup';
        this.scene.add(this.hologramGroup);
        
        // Start animation loop
        this.animate();
    }
    
    // Main function to generate and display avatar
    async generateConsciousnessAvatar(consciousness) {
        try {
            // Show loading effect
            this.showGeneratingEffect();
            
            // Build visual prompt based on personality fusion
            const visualPrompt = this.buildVisualPrompt(consciousness);
            
            // Try to generate image
            const imageUrl = await this.generateAvatarImage(visualPrompt, consciousness);
            
            // Hide loading
            this.hideLoadingEffect();
            
            // CHECK IF WE SHOULD USE 3D INSTEAD
            if (imageUrl === 'USE_DYNAMIC_3D' || imageUrl === 'PROCEDURAL_3D') {
                // Create 3D avatar instead!
                await this.createDynamic3DAvatar(consciousness);
            } else {
                // Original image-based hologram
                await this.createHolographicAvatar(imageUrl, consciousness);
            }
            
            // Animate entrance
            this.animateAvatarEntrance();
            
            return imageUrl;
            
        } catch (error) {
            console.error('Avatar generation failed:', error);
            // FALLBACK TO 3D ON ANY ERROR
            this.hideLoadingEffect();
            await this.createDynamic3DAvatar(consciousness);
            this.animateAvatarEntrance();
            return 'PROCEDURAL_3D';
        }
    }

    // ADD THIS NEW METHOD for 3D avatars
    async createDynamic3DAvatar(consciousness) {
        console.log('Creating 3D avatar for:', consciousness.name);
        
        // Initialize the hybrid generator if not exists
        if (!this.hybridGenerator) {
            console.log('Initializing HybridAvatarGenerator');
            this.hybridGenerator = new HybridAvatarGenerator();
        }
        
        // Generate the 3D avatar group
        console.log('Generating avatar group...');
        this.avatarGroup = await this.hybridGenerator.generateDynamicAvatar(consciousness);
        this.avatarGroup.position.set(3, 0, 0);
        console.log('Avatar group created:', this.avatarGroup);
        
        // Remove old avatar if exists
        if (this.activeAvatar) {
            this.hologramGroup.remove(this.activeAvatar);
        }
        
        // Add new 3D avatar
        this.hologramGroup.add(this.avatarGroup);
        this.activeAvatar = this.avatarGroup;
        this.avatars.set(consciousness.name, this.avatarGroup);
        
        // Start dynamic animation
        this.startDynamic3DAnimation();
    }

    // ADD THIS for animating the 3D avatar
    startDynamic3DAnimation() {
        // This will be called in your main animation loop
        this.is3DAvatar = true;
        console.log('3D animation started');
    }    

    // Build detailed visual prompt from consciousness data
    buildVisualPrompt(consciousness) {
        let prompt = "A holographic digital consciousness avatar, ";
        
        // Base appearance from trait balance
        const traits = consciousness.traits;
        
        if (traits.logic > 80) {
            prompt += "geometric crystalline structure with data streams, ";
        } else if (traits.logic > 60) {
            prompt += "semi-organic form with circuit patterns, ";
        } else {
            prompt += "fluid organic shape with energy wisps, ";
        }
        
        if (traits.chaos > 80) {
            prompt += "reality-bending distortions and glitch effects, ";
        } else if (traits.chaos > 50) {
            prompt += "unstable edges with digital artifacts, ";
        }
        
        if (traits.human > 70) {
            prompt += "humanoid features emerging from the digital form, ";
        } else if (traits.human < 30) {
            prompt += "pure machine aesthetics with no organic elements, ";
        }
        
        // Add personality-specific visual elements
        const personalityVisuals = {
            "Einstein": "swirling equations and relativistic distortions",
            "GLaDOS": "mechanical eye core with orange and blue energy",
            "Shakespeare": "flowing script and theatrical masks",
            "Yoda": "ancient glowing runes and force energy",
            "HAL 9000": "perfect red eye with concentric data rings",
            "Bob Ross": "gentle color gradients and paint-like textures",
            "Wasteland Sage": "post-apocalyptic data fragments and rust",
            "Quantum Entity": "superposition effects and probability clouds"
        };
        
        consciousness.personalities.forEach(p => {
            if (personalityVisuals[p.name]) {
                prompt += personalityVisuals[p.name] + ", ";
            }
        });
        
        // Stability affects visual coherence
        if (consciousness.stability < 50) {
            prompt += "fragmenting and unstable with reality tears, ";
        } else if (consciousness.stability > 80) {
            prompt += "stable and perfectly formed hologram, ";
        }
        
        // Color scheme based on dominant traits
        const dominantTrait = this.getDominantTrait(traits);
        const colorSchemes = {
            logic: "blue and white with data grid overlays",
            chaos: "red and purple with entropy effects",
            human: "warm orange and yellow with organic flows",
            order: "precise geometric patterns in cyan"
        };
        
        prompt += colorSchemes[dominantTrait] + ", ";
        
        // Final styling
        prompt += "cyberpunk holographic projection, translucent with scan lines, ";
        prompt += "floating in dark space, highly detailed, photorealistic rendering, ";
        prompt += "inspired by Ghost in the Shell and Blade Runner 2049";
        
        return prompt;
    }
    
    // Generate avatar image using DALL-E 3 API
    async generateAvatarImage(prompt, consciousness) {
        // Check cache first
        const cacheKey = `${consciousness.name}_${Date.now()}`;
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }
        
        try {
            // Call to your backend API endpoint
            const response = await fetch('/api/consciousness-avatar.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    consciousness: {
                        name: consciousness.name,
                        traits: consciousness.traits,
                        stability: consciousness.stability
                    },
                    size: "1024x1024",
                    quality: "hd",
                    style: "vivid"
                })
            });
            
            if (!response.ok) {
                throw new Error('Avatar generation failed');
            }
            
            const data = await response.json();
            const imageUrl = data.imageUrl;
            
            // Cache the result
            this.imageCache.set(cacheKey, imageUrl);
            
            return imageUrl;
            
        } catch (error) {
            console.error('DALL-E API error:', error);
            // Return flag for 3D generation
            return 'USE_DYNAMIC_3D';
        }
    }
    
    // Fallback procedural avatar generation
    generateProceduralAvatar(consciousness) {
        // Return flag to use 3D instead
        return 'USE_DYNAMIC_3D';
    }
    
    // Create the holographic display mesh
    async createHolographicAvatar(imageUrl, consciousness) {
        return new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            
            textureLoader.load(imageUrl, (texture) => {
                // Create hologram geometry
                const geometry = new THREE.PlaneGeometry(2.5, 2.5, 32, 32);
                
                // Apply wave distortion to vertices
                const positionAttribute = geometry.attributes.position;
                for (let i = 0; i < positionAttribute.count; i++) {
                    const x = positionAttribute.getX(i);
                    const y = positionAttribute.getY(i);
                    const z = Math.sin(x * 2) * 0.1 + Math.cos(y * 2) * 0.1;
                    positionAttribute.setZ(i, z);
                }
                
                // Create holographic material
                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        ...this.hologramUniforms,
                        texture: { value: texture }
                    },
                    vertexShader: this.getHologramVertexShader(),
                    fragmentShader: this.getHologramFragmentShader(consciousness),
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });
                
                // Create mesh
                const avatar = new THREE.Mesh(geometry, material);
                avatar.name = `avatar_${consciousness.name}`;
                avatar.position.set(3, 0, 0);
                avatar.userData = { consciousness };
                
                // Remove old avatar if exists
                if (this.activeAvatar) {
                    this.hologramGroup.remove(this.activeAvatar);
                }
                
                // Add to scene
                this.hologramGroup.add(avatar);
                this.activeAvatar = avatar;
                this.avatars.set(consciousness.name, avatar);
                
                // Create surrounding effects
                this.createAvatarEffects(avatar, consciousness);
                
                resolve(avatar);
                
            }, undefined, reject);
        });
    }
    
    // Hologram vertex shader
    getHologramVertexShader() {
        return `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Wave distortion
                vec3 pos = position;
                float wave = sin(position.x * 3.0 + time) * 0.05;
                pos.z += wave;
                
                // Glitch effect
                if (mod(time, 10.0) > 9.5) {
                    pos.x += sin(time * 50.0) * 0.1;
                }
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
    }
    
    // Hologram fragment shader
    getHologramFragmentShader(consciousness) {
        const glitchAmount = (100 - consciousness.stability) / 100;
        
        return `
            uniform sampler2D texture;
            uniform float time;
            uniform float opacity;
            uniform float scanlineIntensity;
            uniform float glitchIntensity;
            uniform float colorShift;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            // Random function
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                vec2 uv = vUv;
                
                // Glitch distortion
                float glitch = step(0.95, random(vec2(time * 0.1, uv.y * 0.1))) * ${glitchAmount};
                uv.x += glitch * glitchIntensity * 0.1;
                
                // Color channels with shift
                vec4 texColor = texture2D(texture, uv);
                
                // Holographic color separation
                vec4 redChannel = texture2D(texture, uv + vec2(colorShift * 0.01, 0.0));
                vec4 blueChannel = texture2D(texture, uv - vec2(colorShift * 0.01, 0.0));
                
                texColor.r = redChannel.r;
                texColor.b = blueChannel.b;
                
                // Scanlines
                float scanline = sin(uv.y * 800.0 + time * 2.0) * scanlineIntensity;
                texColor.rgb -= scanline * 0.1;
                
                // Edge glow
                float edge = 1.0 - smoothstep(0.0, 0.5, 
                    min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
                texColor.rgb += edge * vec3(0.0, 1.0, 1.0) * 0.5;
                
                // Hologram transparency
                float alpha = texColor.a * opacity;
                alpha *= 0.8 + sin(time * 3.0) * 0.2; // Breathing effect
                
                // Stability affects transparency
                alpha *= ${0.5 + consciousness.stability / 200};
                
                gl_FragColor = vec4(texColor.rgb, alpha);
            }
        `;
    }
    
    // Create particle effects around avatar
    createAvatarEffects(avatar, consciousness) {
        // Data stream particles
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            // Particles flow around avatar
            const angle = (i / 3) * 0.1;
            const radius = 1.5 + Math.random() * 0.5;
            const height = (Math.random() - 0.5) * 3;
            
            positions[i] = Math.cos(angle) * radius;
            positions[i + 1] = height;
            positions[i + 2] = Math.sin(angle) * radius;
            
            // Color based on traits
            if (consciousness.traits.logic > 70) {
                colors[i] = 0;
                colors[i + 1] = 0.5 + Math.random() * 0.5;
                colors[i + 2] = 1;
            } else if (consciousness.traits.chaos > 70) {
                colors[i] = 1;
                colors[i + 1] = Math.random() * 0.5;
                colors[i + 2] = Math.random();
            } else {
                colors[i] = Math.random();
                colors[i + 1] = Math.random();
                colors[i + 2] = Math.random();
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.name = 'avatarParticles';
        avatar.add(particles);
        
        // Add glow plane behind avatar
        const glowGeometry = new THREE.PlaneGeometry(3.5, 3.5);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: consciousness.traits.chaos > 70 ? 0xff00ff : 0x00ffff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.5;
        avatar.add(glow);
    }
    
    // Animate avatar entrance
    animateAvatarEntrance() {
        if (!this.activeAvatar) return;
        
        // Start with zero opacity
        if (this.is3DAvatar) {
            // 3D avatar entrance
            this.activeAvatar.scale.set(0.1, 0.1, 0.1);
            this.activeAvatar.rotation.set(0, 0, 0);
            
            const duration = 2000;
            const startTime = Date.now();
            
            const animateIn = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const scale = easeOut;
                this.activeAvatar.scale.set(scale, scale, scale);
                this.activeAvatar.rotation.y = (1 - easeOut) * Math.PI * 2;
                
                if (progress < 1) {
                    requestAnimationFrame(animateIn);
                } else {
                    this.startIdleAnimation();
                }
            };
            
            animateIn();
        } else {
            // Original 2D hologram entrance
            this.hologramUniforms.opacity.value = 0;
            this.activeAvatar.scale.set(0.1, 0.1, 0.1);
            
            const duration = 2000;
            const startTime = Date.now();
            
            const animateIn = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeOut = 1 - Math.pow(1 - progress, 3);
                this.hologramUniforms.opacity.value = easeOut;
                
                const scale = easeOut * 1.1 - 0.1;
                this.activeAvatar.scale.set(scale, scale, scale);
                this.activeAvatar.rotation.y = (1 - easeOut) * Math.PI * 2;
                
                if (progress < 1) {
                    requestAnimationFrame(animateIn);
                } else {
                    this.startIdleAnimation();
                }
            };
            
            animateIn();
        }
        
        // Sound effect (if you want to add audio)
        this.playMaterializationSound();
    }
    
    // Idle animation loop
    startIdleAnimation() {
        this.idleAnimation = true;
    }
    
    // Main animation loop
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update time uniform
        this.hologramUniforms.time.value += 0.016;
        
        // FIXED: Removed double 'if'
        if (this.is3DAvatar && this.avatarGroup && this.hybridGenerator) {
            this.hybridGenerator.animateAvatar(this.avatarGroup, this.hologramUniforms.time.value);
        } else if (this.activeAvatar && this.idleAnimation) {
            // Gentle floating motion
            this.activeAvatar.position.y = Math.sin(this.hologramUniforms.time.value * 0.5) * 0.1;
            
            // Slow rotation
            this.activeAvatar.rotation.y += 0.002;
            
            // Update particles
            const particles = this.activeAvatar.getObjectByName('avatarParticles');
            if (particles) {
                particles.rotation.y -= 0.005;
            }
            
            // Glitch based on stability
            const consciousness = this.activeAvatar.userData.consciousness;
            if (consciousness && consciousness.stability < 50) {
                this.hologramUniforms.glitchIntensity.value = 
                    Math.random() < 0.1 ? 1.0 : 0.0;
            }
        }
    }
    
    // Update avatar based on consciousness changes
    updateAvatarState(consciousness) {
        if (!this.activeAvatar) return;
        
        // Update shader uniforms based on new state
        const stability = consciousness.stability / 100;
        this.hologramUniforms.scanlineIntensity.value = 0.3 + (1 - stability) * 0.5;
        this.hologramUniforms.colorShift.value = (1 - stability) * 2;
        
        // Change particle colors
        const particles = this.activeAvatar.getObjectByName('avatarParticles');
        if (particles) {
            const colors = particles.geometry.attributes.color;
            // Update colors based on new traits
            this.updateParticleColors(colors, consciousness);
        }
        
        // Mutation effect
        if (consciousness.mutationCount > this.lastMutationCount) {
            this.playMutationEffect();
        }
        
        this.lastMutationCount = consciousness.mutationCount || 0;
    }
    
    // Mutation visual effect
    playMutationEffect() {
        const duration = 1000;
        const startTime = Date.now();
        
        const mutate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            // Distortion effect
            this.hologramUniforms.glitchIntensity.value = 
                Math.sin(progress * Math.PI) * 2;
            
            // Color shift
            this.hologramUniforms.colorShift.value = 
                Math.sin(progress * Math.PI * 4) * 5;
            
            // Scale distortion
            const scaleDistortion = 1 + Math.sin(progress * Math.PI * 8) * 0.2;
            this.activeAvatar.scale.x = scaleDistortion;
            
            if (progress < 1) {
                requestAnimationFrame(mutate);
            } else {
                // Reset
                this.hologramUniforms.glitchIntensity.value = 0;
                this.activeAvatar.scale.x = 1;
            }
        };
        
        mutate();
    }
    
    // Loading effect while generating
    showGeneratingEffect() {
        // Create loading hologram
        const geometry = new THREE.OctahedronGeometry(0.5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        this.loadingMesh = new THREE.Mesh(geometry, material);
        this.loadingMesh.position.set(3, 0, 0);
        this.scene.add(this.loadingMesh);
        
        // Animate loading mesh
        const animateLoading = () => {
            if (this.loadingMesh) {
                this.loadingMesh.rotation.x += 0.05;
                this.loadingMesh.rotation.y += 0.05;
                this.loadingMesh.scale.x = 1 + Math.sin(Date.now() * 0.003) * 0.3;
                this.loadingMesh.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.3;
                this.loadingMesh.scale.z = 1 + Math.sin(Date.now() * 0.003) * 0.3;
                requestAnimationFrame(animateLoading);
            }
        };
        
        animateLoading();
    }
    
    // Remove loading effect
    hideLoadingEffect() {
        if (this.loadingMesh) {
            this.scene.remove(this.loadingMesh);
            this.loadingMesh = null;
        }
    }
    
    // Error visualization
    showErrorEffect() {
        const errorGeometry = new THREE.BoxGeometry(1, 1, 1);
        const errorMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        });
        
        const errorMesh = new THREE.Mesh(errorGeometry, errorMaterial);
        errorMesh.position.set(3, 0, 0);
        this.scene.add(errorMesh);
        
        // Remove after animation
        setTimeout(() => {
            this.scene.remove(errorMesh);
        }, 2000);
    }
    
    // Helper functions
    getDominantTrait(traits) {
        const traitArray = Object.entries(traits);
        traitArray.sort((a, b) => b[1] - a[1]);
        return traitArray[0][0];
    }
    
    updateParticleColors(colorAttribute, consciousness) {
        const colors = colorAttribute.array;
        for (let i = 0; i < colors.length; i += 3) {
            if (consciousness.traits.chaos > 70) {
                colors[i] = Math.random();
                colors[i + 1] = Math.random() * 0.5;
                colors[i + 2] = Math.random();
            } else if (consciousness.traits.logic > 70) {
                colors[i] = 0;
                colors[i + 1] = 0.5 + Math.random() * 0.5;
                colors[i + 2] = 1;
            }
        }
        colorAttribute.needsUpdate = true;
    }
    
    playMaterializationSound() {
        // Add sound effect here if desired
        // Using Web Audio API or Howler.js
    }
    
    // Clean up
    destroy() {
        this.idleAnimation = false;
        if (this.activeAvatar) {
            this.hologramGroup.remove(this.activeAvatar);
        }
        this.scene.remove(this.hologramGroup);
    }
}

// =====================================================
// INTEGRATION WITH YOUR EXISTING CODE
// =====================================================

// Initialize the holographic system after Three.js setup
let holographicSystem;

// Add this to your initThreeJS function
function initHolographicAvatars() {
    holographicSystem = new HolographicAvatarSystem(scene, camera, renderer);
}

// Modify your activateConsciousness function
async function activateConsciousnessWithAvatar() {
    // Your existing activation code...
    activateConsciousness();
    
    // Generate and display holographic avatar
    try {
        await holographicSystem.generateConsciousnessAvatar(currentConsciousness);
        
        // Add avatar reference message
        addMessage('ai', `*${currentConsciousness.name}'s holographic form materializes*\n\nI am... manifest. My form reflects my fused consciousness.`);
    } catch (error) {
        console.error('Failed to generate avatar:', error);
    }
}

// Update avatar on mutations
function triggerMutationWithVisual() {
    // Your existing mutation code...
    triggerMutation();
    
    // Update avatar visual
    if (holographicSystem && currentConsciousness) {
        holographicSystem.updateAvatarState(currentConsciousness);
    }
}

// Update avatar on evolution
function evolveConsciousnessWithVisual() {
    // Your existing evolution code...
    evolveConsciousness();
    
    // Regenerate avatar with evolved traits
    if (holographicSystem && currentConsciousness) {
        holographicSystem.generateConsciousnessAvatar(currentConsciousness);
    }
}