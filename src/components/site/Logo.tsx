const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[11px]">
        <img
          src="https://cdn.poehali.dev/projects/a50bf440-39eb-48cd-8c9b-26529e75ba50/bucket/fdda1341-35c0-48db-be2e-b32c724b5034.jpg"
          alt="МедГид"
          className="h-full w-full object-cover"
        />
      </span>
      <b className="font-head text-[1.3rem] font-extrabold tracking-[-0.03em] text-foreground">
        МедГид
      </b>
    </div>
  );
};

export default Logo;