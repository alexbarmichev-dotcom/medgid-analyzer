const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-accent">
        <span
          className="block h-[15px] w-[15px] rounded-full border-[2.4px] border-accent-foreground"
          style={{ borderBottomColor: 'transparent', transform: 'rotate(42deg)' }}
        />
      </span>
      <b className="font-head text-[1.3rem] font-extrabold tracking-[-0.03em] text-foreground">
        МедГид
      </b>
    </div>
  );
};

export default Logo;
